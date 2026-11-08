
import os
import math
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import (
    User,
    Volunteer,
    Assignment,
    Delivery,
    VolunteerLocation,
    Donation,
    Request as FoodRequest,
)
from app.utils.decorators import role_required, approved_required
from app.utils.logger import log_action
from app.utils.validators import allowed_file
from app.utils.geo import haversine_km
from app.services.notification_service import create_notification


volunteer_bp = Blueprint(
    "volunteer",
    __name__,
    url_prefix="/api/volunteer"
)


# ---------------------------------------------------------
# STATUS CONFIGURATION
# ---------------------------------------------------------

ACTIVE_ASSIGNMENT_STATUSES = [
    "ASSIGNED",
    "ACCEPTED",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "COMPLETED",
]


# ---------------------------------------------------------
# COMMON HELPERS
# ---------------------------------------------------------

def error_response(message, status_code):
    return jsonify({
        "success": False,
        "message": message
    }), status_code


def get_logged_in_volunteer():
    """Get the authenticated user and volunteer profile."""

    user_id = get_jwt_identity()

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None, None

    user = db.session.get(User, user_id)

    if not user:
        return None, None

    return user, user.volunteer_profile


def valid_coordinates(latitude, longitude):
    """Validate GPS coordinates."""

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError):
        return None

    if not math.isfinite(latitude) or not math.isfinite(longitude):
        return None

    if not -90 <= latitude <= 90:
        return None

    if not -180 <= longitude <= 180:
        return None

    return latitude, longitude


def get_latest_volunteer_coordinates(volunteer):
    """Get the latest GPS location, falling back to profile coordinates."""

    latest_location = (
        VolunteerLocation.query
        .filter_by(volunteer_id=volunteer.id)
        .order_by(VolunteerLocation.timestamp.desc())
        .first()
    )

    if latest_location:
        return (
            latest_location.latitude,
            latest_location.longitude
        )

    return (
        volunteer.latitude,
        volunteer.longitude
    )


def get_or_create_delivery(assignment):
    """Get the delivery record or create one if it does not exist."""

    delivery = Delivery.query.filter_by(
        assignment_id=assignment.id
    ).first()

    if delivery is None:
        delivery = Delivery(
            assignment_id=assignment.id,
            status=assignment.status
        )

        db.session.add(delivery)
        db.session.flush()

    return delivery


def notify_delivery_participants(assignment, status):
    """Notify the NGO and donor about delivery progress."""

    food_request = assignment.request

    if not food_request:
        return

    donation = food_request.donation
    volunteer = assignment.volunteer

    if food_request.ngo and food_request.ngo.user:
        create_notification(
            user_id=food_request.ngo.user.id,
            title=f"Delivery Status: {status}",
            message=(
                f"Delivery status updated to {status} "
                f"by volunteer {volunteer.full_name}."
            ),
            notif_type="INFO"
        )

    if donation and donation.donor and donation.donor.user:
        create_notification(
            user_id=donation.donor.user.id,
            title=f"Food Status: {status}",
            message=f"Your donated food status is now {status}.",
            notif_type="INFO"
        )


# =========================================================
# AVAILABLE TASKS
# GET /api/volunteer/available-tasks
# =========================================================

@volunteer_bp.route("/available-tasks", methods=["GET"])
@jwt_required()
@role_required(["VOLUNTEER"])
@approved_required
def get_available_tasks():

    user, volunteer = get_logged_in_volunteer()

    if not user or not volunteer:
        return error_response(
            "Volunteer profile not found.",
            404
        )

    volunteer_lat, volunteer_lon = (
        get_latest_volunteer_coordinates(volunteer)
    )

    open_requests = (
        FoodRequest.query
        .join(Donation)
        .filter(
            Donation.status == "NGO_ACCEPTED",
            FoodRequest.status == "ACCEPTED"
        )
        .all()
    )

    tasks = []

    for food_request in open_requests:

        existing_assignment = (
            Assignment.query
            .filter_by(request_id=food_request.id)
            .filter(
                Assignment.status.in_(
                    ACTIVE_ASSIGNMENT_STATUSES
                )
            )
            .first()
        )

        if existing_assignment:
            continue

        donation = food_request.donation

        if not donation:
            continue

        ngo = food_request.ngo
        donor = donation.donor

        pickup_lat = (
            donation.latitude
            if donation.latitude is not None
            else donor.latitude if donor else None
        )

        pickup_lon = (
            donation.longitude
            if donation.longitude is not None
            else donor.longitude if donor else None
        )

        distance = None

        if (
            pickup_lat is not None
            and pickup_lon is not None
            and volunteer_lat is not None
            and volunteer_lon is not None
        ):
            distance = haversine_km(
                pickup_lat,
                pickup_lon,
                volunteer_lat,
                volunteer_lon
            )

        tasks.append({
            "request_id": food_request.id,
            "donation_id": donation.id,
            "title": donation.title,
            "food_type": donation.food_type,
            "quantity": donation.quantity,
            "description": donation.description,
            "pickup_address": donation.pickup_address,
            "pickup_latitude": pickup_lat,
            "pickup_longitude": pickup_lon,

            "donor_name": (
                donor.organization_name
                if donor else "Donor"
            ),

            "donor_phone": (
                donor.user.phone
                if donor and donor.user else None
            ),

            "ngo_id": ngo.id if ngo else None,

            "ngo_name": (
                ngo.ngo_name
                if ngo else "NGO Shelter"
            ),

            "ngo_address": (
                ngo.address
                if ngo else ""
            ),

            "ngo_phone": (
                ngo.user.phone
                if ngo and ngo.user else None
            ),

            "distance_km": distance,
            "expiry_state": donation.expiry_state(),

            "expiry_time": (
                donation.expiry_time.isoformat()
                if donation.expiry_time else None
            ),

            "status": donation.status,

            "created_at": (
                food_request.requested_at.isoformat()
                if food_request.requested_at else None
            )
        })

    tasks.sort(
        key=lambda task: (
            task["distance_km"] is None,
            task["distance_km"]
            if task["distance_km"] is not None else 0
        )
    )

    return jsonify({
        "success": True,
        "tasks": tasks
    }), 200


# =========================================================
# CLAIM TASK
# POST /api/volunteer/claim-task
# =========================================================

@volunteer_bp.route("/claim-task", methods=["POST"])
@jwt_required()
@role_required(["VOLUNTEER"])
@approved_required
def claim_task():

    data = request.get_json(silent=True) or {}
    request_id = data.get("request_id")

    if not request_id:
        return error_response(
            "Request ID is required.",
            400
        )

    user, volunteer = get_logged_in_volunteer()

    if not user or not volunteer:
        return error_response(
            "Volunteer profile not found.",
            404
        )

    try:
        request_id = int(request_id)
    except (TypeError, ValueError):
        return error_response(
            "Invalid request ID.",
            400
        )

    try:
        food_request = (
            FoodRequest.query
            .filter_by(id=request_id)
            .with_for_update()
            .first()
        )

        if not food_request:
            return error_response(
                "Delivery request not found.",
                404
            )

        donation = food_request.donation

        if (
            not donation
            or donation.status != "NGO_ACCEPTED"
            or food_request.status != "ACCEPTED"
        ):
            return error_response(
                "This delivery task is no longer available.",
                409
            )

        existing_assignment = (
            Assignment.query
            .filter_by(request_id=request_id)
            .filter(
                Assignment.status.in_(
                    ACTIVE_ASSIGNMENT_STATUSES
                )
            )
            .first()
        )

        if existing_assignment:
            return error_response(
                "This task has already been claimed.",
                409
            )

        assignment = Assignment(
            request_id=food_request.id,
            volunteer_id=volunteer.id,
            status="ACCEPTED",
            accepted_at=datetime.utcnow()
        )

        db.session.add(assignment)
        db.session.flush()

        delivery = Delivery(
            assignment_id=assignment.id,
            status="ASSIGNED"
        )

        db.session.add(delivery)

        donation.status = "VOLUNTEER_ASSIGNED"

        db.session.commit()

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Volunteer task claim failed."
        )

        return error_response(
            "Unable to claim this task. Please try again.",
            500
        )

    try:
        log_action(
            user.id,
            "VOLUNTEER_CLAIMED_TASK",
            "Assignment",
            assignment.id,
            (
                f"Volunteer '{volunteer.full_name}' "
                f"claimed '{donation.title}'."
            )
        )

        if food_request.ngo and food_request.ngo.user:
            create_notification(
                user_id=food_request.ngo.user.id,
                title="Volunteer Assigned for Delivery",
                message=(
                    f"Volunteer {volunteer.full_name} accepted "
                    f"the delivery task for {donation.title}."
                ),
                notif_type="SUCCESS"
            )

        if donation.donor and donation.donor.user:
            create_notification(
                user_id=donation.donor.user.id,
                title="Volunteer Assigned for Pickup",
                message=(
                    f"Volunteer {volunteer.full_name} is assigned "
                    f"to pick up {donation.title}."
                ),
                notif_type="INFO"
            )

    except Exception:
        current_app.logger.exception(
            "Task claimed, but notification or logging failed."
        )

    return jsonify({
        "success": True,
        "message": (
            f"You successfully claimed '{donation.title}'."
        ),
        "assignment": assignment.to_dict()
    }), 201


# =========================================================
# VOLUNTEER ASSIGNMENTS
# GET /api/volunteer/assignments
# =========================================================

@volunteer_bp.route("/assignments", methods=["GET"])
@jwt_required()
@role_required(["VOLUNTEER"])
@approved_required
def get_volunteer_assignments():

    user, volunteer = get_logged_in_volunteer()

    if not user or not volunteer:
        return error_response(
            "Volunteer profile not found.",
            404
        )

    assignments = (
        Assignment.query
        .filter_by(volunteer_id=volunteer.id)
        .order_by(Assignment.assigned_at.desc())
        .all()
    )

    return jsonify({
        "success": True,
        "assignments": [
            assignment.to_dict()
            for assignment in assignments
        ]
    }), 200


# =========================================================
# ACCEPT OR REJECT ASSIGNMENT
# POST /api/volunteer/assignments/<id>/respond
# =========================================================

@volunteer_bp.route(
    "/assignments/<int:assignment_id>/respond",
    methods=["POST"]
)
@jwt_required()
@role_required(["VOLUNTEER"])
@approved_required
def respond_assignment(assignment_id):

    data = request.get_json(silent=True) or {}
    action = str(data.get("action", "")).upper()

    if action not in ["ACCEPT", "REJECT"]:
        return error_response(
            "Action must be ACCEPT or REJECT.",
            400
        )

    user, volunteer = get_logged_in_volunteer()

    if not user or not volunteer:
        return error_response(
            "Volunteer profile not found.",
            404
        )

    try:
        assignment = (
            Assignment.query
            .filter_by(id=assignment_id)
            .with_for_update()
            .first()
        )

        if not assignment:
            return error_response(
                "Assignment not found.",
                404
            )

        if assignment.volunteer_id != volunteer.id:
            return error_response(
                "This assignment is not assigned to you.",
                403
            )

        if assignment.status != "ASSIGNED":
            return error_response(
                "This assignment can no longer be accepted or rejected.",
                409
            )

        if action == "ACCEPT":

            assignment.status = "ACCEPTED"
            assignment.accepted_at = datetime.utcnow()

            get_or_create_delivery(assignment)

        else:

            assignment.status = "REJECTED"
            assignment.rejected_at = datetime.utcnow()

        db.session.commit()

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Assignment response failed."
        )

        return error_response(
            "Unable to update assignment.",
            500
        )

    try:
        log_action(
            user.id,
            f"VOLUNTEER_ASSIGNMENT_{action}",
            "Assignment",
            assignment.id,
            f"Volunteer {action.lower()}ed assignment."
        )
    except Exception:
        current_app.logger.exception(
            "Assignment updated, but action logging failed."
        )

    return jsonify({
        "success": True,
        "message": f"Assignment {action.lower()}ed.",
        "assignment": assignment.to_dict()
    }), 200


# =========================================================
# UPDATE DELIVERY STATUS
# POST /api/volunteer/update-status
# =========================================================

@volunteer_bp.route("/update-status", methods=["POST"])
@jwt_required()
@role_required(["VOLUNTEER"])
@approved_required
def update_delivery_status():

    data = request.get_json(silent=True) or {}

    assignment_id = data.get("assignment_id")
    new_status = str(data.get("status", "")).upper()

    valid_statuses = [
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
        "DELIVERED"
    ]

    if not assignment_id or new_status not in valid_statuses:
        return error_response(
            "Valid assignment ID and delivery status are required.",
            400
        )

    user, volunteer = get_logged_in_volunteer()

    if not user or not volunteer:
        return error_response(
            "Volunteer profile not found.",
            404
        )

    try:
        assignment_id = int(assignment_id)
    except (TypeError, ValueError):
        return error_response(
            "Invalid assignment ID.",
            400
        )

    allowed_previous = {
        "PICKED_UP": ["ACCEPTED"],
        "OUT_FOR_DELIVERY": ["PICKED_UP"],
        "DELIVERED": ["OUT_FOR_DELIVERY"]
    }

    try:
        assignment = (
            Assignment.query
            .filter_by(id=assignment_id)
            .with_for_update()
            .first()
        )

        if not assignment:
            return error_response(
                "Assignment not found.",
                404
            )

        if assignment.volunteer_id != volunteer.id:
            return error_response(
                "This assignment is not assigned to you.",
                403
            )

        if assignment.status not in allowed_previous[new_status]:
            return error_response(
                (
                    f"Invalid transition from "
                    f"{assignment.status} to {new_status}."
                ),
                400
            )

        delivery = get_or_create_delivery(assignment)

        latitude, longitude = get_latest_volunteer_coordinates(
            volunteer
        )

        delivery.status = new_status
        assignment.status = new_status

        if assignment.request and assignment.request.donation:
            assignment.request.donation.status = new_status

        if new_status == "PICKED_UP":

            delivery.pickup_time = datetime.utcnow()
            delivery.pickup_latitude = latitude
            delivery.pickup_longitude = longitude

        elif new_status == "DELIVERED":

            delivery.delivery_time = datetime.utcnow()
            delivery.delivery_latitude = latitude
            delivery.delivery_longitude = longitude

        db.session.commit()

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Delivery status update failed."
        )

        return error_response(
            "Unable to update delivery status.",
            500
        )

    try:
        log_action(
            user.id,
            f"DELIVERY_STATUS_{new_status}",
            "Delivery",
            delivery.id,
            f"Volunteer updated delivery status to {new_status}."
        )

        notify_delivery_participants(
            assignment,
            new_status
        )

    except Exception:
        current_app.logger.exception(
            "Delivery updated, but notification or logging failed."
        )

    return jsonify({
        "success": True,
        "message": f"Delivery status updated to {new_status}.",
        "delivery": delivery.to_dict()
    }), 200


# =========================================================
# UPLOAD DELIVERY PROOF
# POST /api/volunteer/upload-proof
# =========================================================

@volunteer_bp.route("/upload-proof", methods=["POST"])
@jwt_required()
@role_required(["VOLUNTEER"])
@approved_required
def upload_delivery_proof():

    assignment_id = request.form.get("assignment_id")

    if not assignment_id:
        return error_response(
            "Assignment ID is required.",
            400
        )

    try:
        assignment_id = int(assignment_id)
    except (TypeError, ValueError):
        return error_response(
            "Invalid assignment ID.",
            400
        )

    user, volunteer = get_logged_in_volunteer()

    if not user or not volunteer:
        return error_response(
            "Volunteer profile not found.",
            404
        )

    if "proof_image" not in request.files:
        return error_response(
            "Proof image is required.",
            400
        )

    file = request.files["proof_image"]

    if not file or not file.filename:
        return error_response(
            "No image selected.",
            400
        )

    if not allowed_file(file.filename):
        return error_response(
            "Invalid image file type.",
            400
        )

    saved_file_path = None

    try:
        assignment = (
            Assignment.query
            .filter_by(id=assignment_id)
            .with_for_update()
            .first()
        )

        if not assignment:
            return error_response(
                "Assignment not found.",
                404
            )

        if assignment.volunteer_id != volunteer.id:
            return error_response(
                "This assignment is not assigned to you.",
                403
            )

        if assignment.status != "OUT_FOR_DELIVERY":
            return error_response(
                "Proof can only be uploaded after pickup and dispatch.",
                409
            )

        delivery = get_or_create_delivery(assignment)

        latitude, longitude = get_latest_volunteer_coordinates(
            volunteer
        )

        filename = secure_filename(file.filename)

        unique_filename = (
            f"proof_{assignment.id}_"
            f"{int(datetime.utcnow().timestamp())}_"
            f"{filename}"
        )

        upload_dir = os.path.join(
            current_app.config["UPLOAD_FOLDER"],
            "delivery"
        )

        os.makedirs(upload_dir, exist_ok=True)

        saved_file_path = os.path.join(
            upload_dir,
            unique_filename
        )

        file.save(saved_file_path)

        delivery.proof_image = (
            f"/uploads/delivery/{unique_filename}"
        )

        delivery.status = "DELIVERED"
        delivery.delivery_time = datetime.utcnow()
        delivery.delivery_latitude = latitude
        delivery.delivery_longitude = longitude

        assignment.status = "DELIVERED"

        if assignment.request and assignment.request.donation:
            assignment.request.donation.status = "DELIVERED"

        db.session.commit()

    except Exception:
        db.session.rollback()

        if saved_file_path and os.path.exists(saved_file_path):
            try:
                os.remove(saved_file_path)
            except OSError:
                current_app.logger.exception(
                    "Could not remove an orphaned proof image."
                )

        current_app.logger.exception(
            "Delivery proof upload failed."
        )

        return error_response(
            "Unable to upload delivery proof.",
            500
        )

    try:
        log_action(
            user.id,
            "DELIVERY_PROOF_UPLOADED",
            "Delivery",
            delivery.id,
            "Volunteer uploaded delivery proof."
        )

        notify_delivery_participants(
            assignment,
            "DELIVERED"
        )

    except Exception:
        current_app.logger.exception(
            "Proof uploaded, but notification or logging failed."
        )

    return jsonify({
        "success": True,
        "message": "Delivery proof uploaded successfully.",
        "delivery": delivery.to_dict()
    }), 200
