
import logging

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.notification import Notification

logger = logging.getLogger(__name__)

notification_bp = Blueprint(
    'notification',
    __name__,
    url_prefix='/api/notifications'
)


# GET: Fetch logged-in user's notifications
@notification_bp.route('', methods=['GET'])
@jwt_required()
def get_user_notifications():
    try:
        user_id = get_jwt_identity()

        notifications = (
            Notification.query
            .filter_by(user_id=int(user_id))
            .order_by(Notification.created_at.desc())
            .all()
        )

        return jsonify({
            'success': True,
            'notifications': [
                notification.to_dict()
                for notification in notifications
            ]
        }), 200

    except Exception:
        db.session.rollback()
        logger.exception("Error fetching user notifications")

        return jsonify({
            'success': False,
            'message': 'Unable to fetch notifications'
        }), 500


# POST: Mark one notification as read
@notification_bp.route('/<int:notif_id>/read', methods=['POST'])
@jwt_required()
def mark_as_read(notif_id):
    try:
        user_id = int(get_jwt_identity())

        notification = Notification.query.filter_by(
            id=notif_id,
            user_id=user_id
        ).first()

        if notification is None:
            return jsonify({
                'success': False,
                'message': 'Notification not found'
            }), 404

        notification.is_read = True
        db.session.commit()

        return jsonify({
            'success': True,
            'notification': notification.to_dict()
        }), 200

    except Exception:
        db.session.rollback()
        logger.exception("Error marking notification as read")

        return jsonify({
            'success': False,
            'message': 'Unable to mark notification as read'
        }), 500


# POST: Mark all logged-in user's notifications as read
@notification_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_as_read():
    try:
        user_id = int(get_jwt_identity())

        Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).update(
            {'is_read': True},
            synchronize_session=False
        )

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'All notifications marked as read'
        }), 200

    except Exception:
        db.session.rollback()
        logger.exception("Error marking all notifications as read")

        return jsonify({
            'success': False,
            'message': 'Unable to mark all notifications as read'
        }), 500
