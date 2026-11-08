
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import desc
import logging

from app.extensions import db
from app.models.notification import Notification


notification_bp = Blueprint(
    "notification",
    __name__,
    url_prefix="/api/notifications"
)

logger = logging.getLogger(__name__)


# =====================================================
# GET ALL NOTIFICATIONS FOR LOGGED-IN USER
# GET /api/notifications
# =====================================================
@notification_bp.route("", methods=["GET"])
@jwt_required()
def get_user_notifications():

    try:
        user_id = get_jwt_identity()

        notifications = (
            Notification.query
            .filter_by(user_id=user_id)
            .order_by(desc(Notification.created_at))
            .all()
        )

        notification_list = [
            notification.to_dict()
            for notification in notifications
        ]

        unread_count = sum(
            1 for notification in notifications
            if not notification.is_read
        )

        return jsonify({
            "success": True,
            "notifications": notification_list,
            "total": len(notification_list),
            "unread_count": unread_count
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        logger.exception("Database error while fetching notifications")

        return jsonify({
            "success": False,
            "message": "Database error while retrieving notifications"
        }), 500

    except Exception:
        db.session.rollback()
        logger.exception("Unexpected error while fetching notifications")

        return jsonify({
            "success": False,
            "message": "Unable to retrieve notifications"
        }), 500


# =====================================================
# MARK ONE NOTIFICATION AS READ
# POST /api/notifications/<id>/read
# =====================================================
@notification_bp.route("/<int:notif_id>/read", methods=["POST"])
@jwt_required()
def mark_as_read(notif_id):

    try:
        user_id = get_jwt_identity()

        notification = Notification.query.filter_by(
            id=notif_id,
            user_id=user_id
        ).first()

        if notification is None:
            return jsonify({
                "success": False,
                "message": "Notification not found"
            }), 404

        if not notification.is_read:
            notification.is_read = True
            db.session.commit()

        return jsonify({
            "success": True,
            "message": "Notification marked as read",
            "notification": notification.to_dict()
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        logger.exception("Database error while marking notification as read")

        return jsonify({
            "success": False,
            "message": "Database error while updating notification"
        }), 500

    except Exception:
        db.session.rollback()
        logger.exception("Unexpected error while marking notification as read")

        return jsonify({
            "success": False,
            "message": "Unable to update notification"
        }), 500


# =====================================================
# MARK ALL NOTIFICATIONS AS READ
# POST /api/notifications/read-all
# =====================================================
@notification_bp.route("/read-all", methods=["POST"])
@jwt_required()
def mark_all_as_read():

    try:
        user_id = get_jwt_identity()

        Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).update(
            {"is_read": True},
            synchronize_session=False
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "All notifications marked as read"
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        logger.exception("Database error while marking all notifications as read")

        return jsonify({
            "success": False,
            "message": "Unable to update all notifications"
        }), 500

    except Exception:
        db.session.rollback()
        logger.exception("Unexpected error while marking all notifications as read")

        return jsonify({
            "success": False,
            "message": "Unexpected error while updating notifications"
        }), 500
