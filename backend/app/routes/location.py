
import math
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import (
    User,
    Volunteer,
    Donor,
    NGO,
    Donation,
    Request as FoodRequest,
    Assignment,
    VolunteerLocation,
)

location_bp = Blueprint(
    "location",
    __name__,
    url_prefix="/api/location"
)

ACTIVE_ASSIGNMENT_STATUSES = [
    "ASSIGNED",
    "ACCEPTED",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
]

ACTIVE_DONATION_STATUSES = [
    "APPROVED",
    "DONOR_ACCEPTED",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
]


# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------

def api_error(message, status_code):
    return jsonify({
        "success": False,
        "message": message
    }), status_code


def get_current_user():
    """Get authenticated user using JWT identity."""
    identity = get_jwt_identity()

    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None

    return db.session.get(User, user_id)


def admin_required_user():
    """Verify that the authenticated user is an admin."""
    user = get_current_user()

    if not user:
        return None, api_error("User not found", 404)

    if user.role != "ADMIN":
        return None, api_error("Admin access required", 403)

    return user, None


def latest_volunteer_location(volunteer_id):
    """Return the latest GPS record for a volunteer."""
    return (
        VolunteerLocation.query
        .filter_by(volunteer_id=volunteer_id)
        .order_by(VolunteerLocation.timestamp.desc())
        .first()
    )


def valid_coordinates(latitude, longitude):
    """Validate coordinate values and geographic ranges."""
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


def volunteer_coordinates(volunteer):
    """Get latest GPS coordinates, falling back to profile coordinates."""
    latest = latest_volunteer_location(volunteer.id)

    latitude = (
        latest.latitude
        if latest and latest.latitude is not None
        else volunteer.latitude
    )

    longitude = (
        latest.longitude
        if latest and latest.longitude is not None
        else volunteer.longitude
    )

    return latitude, longitude, latest


# ---------------------------------------------------------
# 1. ADMIN LIVE LOCATION FEED
# GET /api/location/live-feed
# ADMIN ONLY
# ---------------------------------------------------------

@location_bp.route("/live-feed", methods=["GET"])
@jwt_required()
def get_live_feed():

    admin, error = admin_required_user()

    if error:
        return error

    # DONORS
    donor_list = []

    donors = Donor.query.all()

    for donor in donors:

        active_count = Donation.query.filter(
            Donation.donor_id == donor.id,
            Donation.status.in_(ACTIVE_DONATION_STATUSES)
        ).count()

        donor_list.append({
            "donor_id": donor.id,
            "user_id": donor.user_id,
            "organization_name": (
                donor.organization_name
                or (donor.user.username if donor.user else "Donor")
            ),
            "phone": donor.user.phone if donor.user else None,
            "address": donor.address,
            "latitude": donor.latitude,
            "longitude": donor.longitude,
            "active_donations_count": active_count
        })

    # NGOS
    ngo_list = []

    ngos = NGO.query.all()

    for ngo in ngos:

        if ngo.user and (
            ngo.user.approval_status != "APPROVED"
            and ngo.user.is_approved is False
        ):
            continue

        active_count = FoodRequest.query.filter(
            FoodRequest.ngo_id == ngo.id,
            FoodRequest.status.in_(["PENDING", "ACCEPTED"])
        ).count()

        ngo_list.append({
            "ngo_id": ngo.id,
            "user_id": ngo.user_id,
            "ngo_name": ngo.ngo_name,
            "registration_number": ngo.registration_number,
            "phone": ngo.user.phone if ngo.user else None,
            "address": ngo.address,
            "latitude": ngo.latitude,
            "longitude": ngo.longitude,
            "active_requests_count": active_count
        })

    # VOLUNTEERS
    volunteer_list = []

    volunteers = Volunteer.query.all()

    for volunteer in volunteers:

        latitude, longitude, latest = volunteer_coordinates(volunteer)

        active_assignment = (
            Assignment.query
            .filter(
                Assignment.volunteer_id == volunteer.id,
                Assignment.status.in_(ACTIVE_ASSIGNMENT_STATUSES)
            )
            .order_by(Assignment.assigned_at.desc())
            .first()
        )

        active_task = None

        if active_assignment and active_assignment.request:

            food_request = active_assignment.request
            donation = food_request.donation
            ngo = food_request.ngo

            donor = donation.donor if donation else None

            active_task = {
                "assignment_id": active_assignment.id,
                "status": active_assignment.status,

                "donation_title": (
                    donation.title if donation else "Food Package"
                ),

                "quantity": donation.quantity if donation else "",

                "pickup_address": (
                    donation.pickup_address
                    if donation
                    else (donor.address if donor else None)
                ),

                "pickup_latitude": (
                    donation.latitude
                    if donation and donation.latitude is not None
                    else (donor.latitude if donor else None)
                ),

                "pickup_longitude": (
                    donation.longitude
                    if donation and donation.longitude is not None
                    else (donor.longitude if donor else None)
                ),

                "donor_name": (
                    donor.organization_name if donor else "Donor"
                ),

                "donor_phone": (
                    donor.user.phone
                    if donor and donor.user
                    else None
                ),

                "dropoff_address": ngo.address if ngo else None,
                "dropoff_latitude": ngo.latitude if ngo else None,
                "dropoff_longitude": ngo.longitude if ngo else None,
                "ngo_name": ngo.ngo_name if ngo else "NGO Hub",

                "ngo_phone": (
                    ngo.user.phone
                    if ngo and ngo.user
                    else None
                )
            }

        volunteer_list.append({
            "volunteer_id": volunteer.id,
            "user_id": volunteer.user_id,
            "full_name": volunteer.full_name,
            "phone": (
                volunteer.user.phone if volunteer.user else None
            ),
            "vehicle_type": volunteer.vehicle_type or "Bike",
            "is_available": volunteer.is_available,
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": (
                latest.timestamp.isoformat()
                if latest and latest.timestamp
                else None
            ),
            "active_task": active_task
        })

    # ACTIVE DELIVERIES
    active_deliveries = []

    assignments = Assignment.query.filter(
        Assignment.status.in_(ACTIVE_ASSIGNMENT_STATUSES)
    ).all()

    for assignment in assignments:

        food_request = assignment.request

        if not food_request:
            continue

        donation = food_request.donation
        ngo = food_request.ngo

        donor = donation.donor if donation else None
        volunteer = assignment.volunteer

        volunteer_latest = (
            latest_volunteer_location(volunteer.id)
            if volunteer
            else None
        )

        donation_latitude = (
            donation.latitude
            if donation and donation.latitude is not None
            else (donor.latitude if donor else None)
        )

        donation_longitude = (
            donation.longitude
            if donation and donation.longitude is not None
            else (donor.longitude if donor else None)
        )

        volunteer_latitude = (
            volunteer_latest.latitude
            if volunteer_latest
            and volunteer_latest.latitude is not None
            else (volunteer.latitude if volunteer else None)
        )

        volunteer_longitude = (
            volunteer_latest.longitude
            if volunteer_latest
            and volunteer_latest.longitude is not None
            else (volunteer.longitude if volunteer else None)
        )

        active_deliveries.append({

            "assignment_id": assignment.id,
            "request_id": food_request.id,
            "status": assignment.status,

            "assigned_at": (
                assignment.assigned_at.isoformat()
                if assignment.assigned_at
                else None
            ),

            "donation": {
                "id": donation.id if donation else None,
                "title": donation.title if donation else "Food Donation",
                "food_type": donation.food_type if donation else "",
                "quantity": donation.quantity if donation else "",
                "pickup_address": (
                    donation.pickup_address
                    if donation
                    else (donor.address if donor else None)
                ),
                "latitude": donation_latitude,
                "longitude": donation_longitude
            },

            "donor": {
                "id": donor.id if donor else None,
                "name": (
                    donor.organization_name if donor else "Donor"
                ),
                "phone": (
                    donor.user.phone
                    if donor and donor.user
                    else None
                ),
                "address": donor.address if donor else None,
                "latitude": donor.latitude if donor else None,
                "longitude": donor.longitude if donor else None
            },

            "ngo": {
                "id": ngo.id if ngo else None,
                "name": ngo.ngo_name if ngo else "NGO",
                "phone": (
                    ngo.user.phone
                    if ngo and ngo.user
                    else None
                ),
                "address": ngo.address if ngo else None,
                "latitude": ngo.latitude if ngo else None,
                "longitude": ngo.longitude if ngo else None
            },

            "volunteer": {
                "id": volunteer.id if volunteer else None,
                "name": (
                    volunteer.full_name if volunteer else "Volunteer"
                ),
                "phone": (
                    volunteer.user.phone
                    if volunteer and volunteer.user
                    else None
                ),
                "vehicle_type": (
                    volunteer.vehicle_type
                    if volunteer
                    else "Bike"
                ),
                "latitude": volunteer_latitude,
                "longitude": volunteer_longitude,
                "last_ping": (
                    volunteer_latest.timestamp.isoformat()
                    if volunteer_latest
                    and volunteer_latest.timestamp
                    else None
                )
            }
        })

    return jsonify({
        "success": True,

        "current_user": {
            "id": admin.id,
            "username": admin.username,
            "role": admin.role
        },

        "donors": donor_list,
        "ngos": ngo_list,
        "volunteers": volunteer_list,
        "active_deliveries": active_deliveries

    }), 200


# ---------------------------------------------------------
# 2. ADMIN VIEW ALL VOLUNTEER LOCATIONS
# GET /api/location/volunteers
# ADMIN ONLY
# ---------------------------------------------------------

@location_bp.route("/volunteers", methods=["GET"])
@jwt_required()
def get_all_locations():

    admin, error = admin_required_user()

    if error:
        return error

    volunteers = Volunteer.query.all()
    results = []

    for volunteer in volunteers:

        latitude, longitude, latest = volunteer_coordinates(volunteer)

        results.append({

            "volunteer_id": volunteer.id,
            "full_name": volunteer.full_name,

            "phone": (
                volunteer.user.phone
                if volunteer.user
                else None
            ),

            "latitude": latitude,
            "longitude": longitude,

            "vehicle_type": volunteer.vehicle_type,
            "is_available": volunteer.is_available,

            "timestamp": (
                latest.timestamp.isoformat()
                if latest and latest.timestamp
                else None
            )
        })

    return jsonify({
        "success": True,
        "volunteers": results
    }), 200


# ---------------------------------------------------------
# 3. UPDATE AUTHENTICATED USER LOCATION
# POST /api/location/update
# DONOR / NGO / VOLUNTEER
# ---------------------------------------------------------

@location_bp.route("/update", methods=["POST"])
@jwt_required()
def update_location():

    data = request.get_json(silent=True) or {}

    coordinates = valid_coordinates(
        data.get("latitude"),
        data.get("longitude")
    )

    if coordinates is None:
        return api_error(
            "Valid latitude and longitude are required",
            400
        )

    latitude, longitude = coordinates

    user = get_current_user()

    if not user:
        return api_error("User not found", 404)

    now = datetime.utcnow()

    try:

        if user.role == "VOLUNTEER":

            volunteer = user.volunteer_profile

            if not volunteer:
                return api_error(
                    "Volunteer profile not found",
                    404
                )

            volunteer.latitude = latitude
            volunteer.longitude = longitude

            location = VolunteerLocation(
                volunteer_id=volunteer.id,
                latitude=latitude,
                longitude=longitude,
                timestamp=now
            )

            db.session.add(location)

            message = "Volunteer location updated"

        elif user.role == "DONOR":

            donor = user.donor_profile

            if not donor:
                return api_error(
                    "Donor profile not found",
                    404
                )

            donor.latitude = latitude
            donor.longitude = longitude

            message = "Donor location updated"

        elif user.role == "NGO":

            ngo = user.ngo_profile

            if not ngo:
                return api_error(
                    "NGO profile not found",
                    404
                )

            ngo.latitude = latitude
            ngo.longitude = longitude

            message = "NGO location updated"

        else:
            return api_error(
                "This user role cannot update a location",
                403
            )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": message,
            "role": user.role,
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": now.isoformat()
        }), 200

    except Exception:
        db.session.rollback()

        return api_error(
            "Unable to save location",
            500
        )
