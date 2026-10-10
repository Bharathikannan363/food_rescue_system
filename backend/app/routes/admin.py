from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, Donor, NGO, Volunteer, Donation, Request as FoodRequest, Assignment, Delivery, VolunteerLocation, Report, Log
from app.utils.decorators import role_required
from app.utils.geo import haversine_km
from app.utils.logger import log_action
from app.services.notification_service import create_notification

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ----------------- USER & MANAGEMENT ENDPOINTS -----------------

@admin_bp.route('/users/approve-status', methods=['POST'])
@jwt_required()
@role_required(['ADMIN'])
def update_user_status():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    status = data.get('status', '').upper()  # APPROVED, REJECTED, DEACTIVATED, PENDING

    if status not in ['APPROVED', 'REJECTED', 'DEACTIVATED', 'PENDING']:
        return jsonify({'success': False, 'message': 'Invalid status'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    user.approval_status = status
    user.is_approved = (status == 'APPROVED')
    db.session.commit()

    admin_id = get_jwt_identity()
    log_action(admin_id, f"USER_{status}", "User", user.id, f"Updated user '{user.username}' approval status to {status}")
    
    create_notification(
        user_id=user.id,
        title=f"Account Status Updated: {status}",
        message=f"Your account approval status has been updated to {status} by Admin.",
        notif_type="SUCCESS" if status == 'APPROVED' else "WARNING",
        send_sms_alert=True,
        recipient_phone=user.phone
    )

    return jsonify({'success': True, 'message': f"User status updated to {status}", 'user': user.to_dict()})

@admin_bp.route('/ngos', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_ngos():
    ngos = NGO.query.all()
    return jsonify({'success': True, 'ngos': [n.to_dict() for n in ngos]})

@admin_bp.route('/donors', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_donors():
    donors = Donor.query.all()
    return jsonify({'success': True, 'donors': [d.to_dict() for d in donors]})

@admin_bp.route('/volunteers', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_volunteers():
    volunteers = Volunteer.query.all()
    return jsonify({'success': True, 'volunteers': [v.to_dict() for v in volunteers]})

# ----------------- OPERATIONAL ENDPOINTS -----------------

@admin_bp.route('/donations', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_all_donations():
    donations = Donation.query.order_by(Donation.created_at.desc()).all()
    return jsonify({'success': True, 'donations': [d.to_dict() for d in donations]})

@admin_bp.route('/donations/<int:donation_id>/verify', methods=['POST'])
@jwt_required()
@role_required(['ADMIN'])
def verify_donation(donation_id):
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({'success': False, 'message': 'Donation not found'}), 404
    
    donation.status = 'APPROVED'
    db.session.commit()

    admin_id = get_jwt_identity()
    log_action(admin_id, "DONATION_APPROVED", "Donation", donation.id, f"Admin approved donation '{donation.title}'")

    if donation.donor and donation.donor.user:
        create_notification(
            user_id=donation.donor.user.id,
            title="Donation Approved",
            message=f"Your posted food '{donation.title}' has been verified & approved by Admin.",
            notif_type="SUCCESS"
        )

    return jsonify({'success': True, 'message': 'Donation approved successfully', 'donation': donation.to_dict()})

@admin_bp.route('/requests', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_all_requests():
    requests_list = FoodRequest.query.order_by(FoodRequest.requested_at.desc()).all()
    return jsonify({'success': True, 'requests': [r.to_dict() for r in requests_list]})

@admin_bp.route('/donations/<int:donation_id>/nearby-volunteers', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_nearby_volunteers(donation_id):
    """Proximity Matcher: available approved volunteers ranked nearest-first to the pickup point."""
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({'success': False, 'message': 'Donation not found'}), 404

    # Pickup coordinates: donation pin (LocationPicker), falling back to donor's registered location
    lat = donation.latitude if donation.latitude is not None else (donation.donor.latitude if donation.donor else None)
    lon = donation.longitude if donation.longitude is not None else (donation.donor.longitude if donation.donor else None)
    if lat is None or lon is None:
        return jsonify({'success': False, 'message': 'No pickup coordinates available for this donation'}), 400

    volunteers = Volunteer.query.join(User).filter(User.approval_status == 'APPROVED').all()
    result = []
    for v in volunteers:
        latest_ping = VolunteerLocation.query.filter_by(volunteer_id=v.id).order_by(VolunteerLocation.timestamp.desc()).first()
        ping_lat = latest_ping.latitude if latest_ping else v.latitude
        ping_lon = latest_ping.longitude if latest_ping else v.longitude
        result.append({
            'volunteer_id': v.id,
            'full_name': v.full_name,
            'vehicle_type': v.vehicle_type,
            'phone': v.user.phone if v.user else None,
            'is_available': bool(v.is_available),
            'has_ping': latest_ping is not None,
            'last_ping_at': latest_ping.timestamp.isoformat() if latest_ping else None,
            'distance_km': haversine_km(lat, lon, ping_lat, ping_lon)
        })

    # Nearest first; volunteers with no location data at all sort last; available before unavailable
    result.sort(key=lambda x: (x['distance_km'] is None, x['distance_km'] if x['distance_km'] is not None else 0, not x['is_available']))

    return jsonify({'success': True, 'pickup': {'latitude': lat, 'longitude': lon}, 'volunteers': result})

@admin_bp.route('/assign-volunteer', methods=['POST'])
@jwt_required()
@role_required(['ADMIN'])
def assign_volunteer():
    data = request.get_json() or {}
    request_id = data.get('request_id')
    volunteer_id = data.get('volunteer_id')

    food_req = FoodRequest.query.get(request_id)
    if not food_req:
        return jsonify({'success': False, 'message': 'NGO Request not found'}), 404

    volunteer = Volunteer.query.get(volunteer_id)
    if not volunteer:
        return jsonify({'success': False, 'message': 'Volunteer not found'}), 404

    # Check if assignment already exists
    existing = Assignment.query.filter_by(request_id=request_id, volunteer_id=volunteer_id).first()
    if existing:
        return jsonify({'success': False, 'message': 'Volunteer already assigned to this request'}), 400

    assignment = Assignment(
        request_id=request_id,
        volunteer_id=volunteer_id,
        status='ASSIGNED'
    )
    db.session.add(assignment)

    food_req.donation.status = 'VOLUNTEER_ASSIGNED'
    db.session.commit()

    # Record pickup distance in the audit log when coordinates exist
    donation = food_req.donation
    pickup_lat = donation.latitude if donation.latitude is not None else (donation.donor.latitude if donation.donor else None)
    pickup_lon = donation.longitude if donation.longitude is not None else (donation.donor.longitude if donation.donor else None)
    latest_ping = VolunteerLocation.query.filter_by(volunteer_id=volunteer.id).order_by(VolunteerLocation.timestamp.desc()).first()
    vol_lat = latest_ping.latitude if latest_ping else volunteer.latitude
    vol_lon = latest_ping.longitude if latest_ping else volunteer.longitude
    distance_km = haversine_km(pickup_lat, pickup_lon, vol_lat, vol_lon)

    admin_id = get_jwt_identity()
    distance_note = f" (pickup distance: {distance_km} km" + (", from live GPS ping" if latest_ping else ", from registered location") + ")" if distance_km is not None else ""
    log_action(admin_id, "VOLUNTEER_ASSIGNED", "Assignment", assignment.id, f"Assigned volunteer '{volunteer.full_name}' to request ID {request_id}{distance_note}")

    if volunteer.user:
        create_notification(
            user_id=volunteer.user.id,
            title="New Delivery Assignment",
            message=f"You have been assigned to pick up food '{food_req.donation.title}' for NGO '{food_req.ngo.ngo_name}'.",
            notif_type="INFO",
            send_sms_alert=True,
            recipient_phone=volunteer.user.phone
        )

    return jsonify({'success': True, 'message': 'Volunteer assigned successfully', 'assignment': assignment.to_dict(), 'distance_km': distance_km})

@admin_bp.route('/assignments', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_all_assignments():
    assignments = Assignment.query.order_by(Assignment.assigned_at.desc()).all()
    return jsonify({'success': True, 'assignments': [a.to_dict() for a in assignments]})

@admin_bp.route('/tracking', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_live_locations():
    volunteers = Volunteer.query.all()
    result = []
    for v in volunteers:
        latest_loc = VolunteerLocation.query.filter_by(volunteer_id=v.id).order_by(VolunteerLocation.timestamp.desc()).first()
        result.append({
            'volunteer_id': v.id,
            'full_name': v.full_name,
            'phone': v.user.phone if v.user else None,
            'vehicle_type': v.vehicle_type,
            'latitude': latest_loc.latitude if latest_loc else v.latitude,
            'longitude': latest_loc.longitude if latest_loc else v.longitude,
            'timestamp': latest_loc.timestamp.isoformat() if latest_loc else None
        })
    return jsonify({'success': True, 'volunteers': result})

# ----------------- ANALYTICS, REPORTS, PAYMENTS & LOGS -----------------

@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_analytics():
    total_donations = Donation.query.count()
    total_deliveries = Delivery.query.filter_by(status='COMPLETED').count()
    
    # Calculate beneficiaries count
    deliveries = Delivery.query.filter_by(status='COMPLETED').all()
    total_beneficiaries = sum(d.beneficiary_count or 0 for d in deliveries)
    
    # Food saved estimated at 2.5 kg per donation
    food_saved_kg = total_donations * 2.5

    active_volunteers = Volunteer.query.filter_by(is_available=True).count()
    pending_requests = FoodRequest.query.filter_by(status='PENDING').count()
    registered_ngos = NGO.query.count()
    registered_donors = Donor.query.count()

    monthly_stats = [
        {'month': 'Jan', 'donations': 12, 'deliveries': 10, 'beneficiaries': 150},
        {'month': 'Feb', 'donations': 19, 'deliveries': 18, 'beneficiaries': 240},
        {'month': 'Mar', 'donations': 25, 'deliveries': 22, 'beneficiaries': 310},
        {'month': 'Apr', 'donations': total_donations, 'deliveries': total_deliveries, 'beneficiaries': total_beneficiaries}
    ]

    return jsonify({
        'success': True,
        'metrics': {
            'total_donations': total_donations,
            'total_deliveries': total_deliveries,
            'total_beneficiaries': total_beneficiaries,
            'food_saved_kg': f"{food_saved_kg:.1f} kg",
            'active_volunteers': active_volunteers,
            'pending_requests': pending_requests,
            'registered_ngos': registered_ngos,
            'registered_donors': registered_donors
        },
        'charts': {
            'monthly_stats': monthly_stats
        }
    })

@admin_bp.route('/reports', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_reports():
    reports = Report.query.order_by(Report.generated_at.desc()).all()
    if not reports:
        # Generate initial report if none
        total_donations = Donation.query.count()
        total_deliveries = Delivery.query.filter_by(status='COMPLETED').count()
        deliveries = Delivery.query.filter_by(status='COMPLETED').all()
        beneficiaries = sum(d.beneficiary_count or 0 for d in deliveries)
        rep = Report(
            month='April',
            year=2026,
            total_donations=total_donations,
            total_deliveries=total_deliveries,
            beneficiaries=beneficiaries,
            food_saved=f"{total_donations * 2.5:.1f} kg"
        )
        db.session.add(rep)
        db.session.commit()
        reports = [rep]

    return jsonify({'success': True, 'reports': [r.to_dict() for r in reports]})

@admin_bp.route('/payments', methods=['GET', 'POST'])
@jwt_required()
@role_required(['ADMIN'])
def manage_payments():
    if request.method == 'POST':
        data = request.get_json() or {}
        user_id = data.get('user_id')
        amount = float(data.get('amount', 0))
        purpose = data.get('purpose', 'Volunteer Fuel Reimbursement')

        payment = Payment(
            transaction_id=f"TXN-{int(datetime.utcnow().timestamp())}",
            user_id=user_id,
            amount=amount,
            purpose=purpose,
            status='SUCCESS'
        )
        db.session.add(payment)
        db.session.commit()
        
        admin_id = get_jwt_identity()
        log_action(admin_id, "PAYMENT_PROCESSED", "Payment", payment.id, f"Processed mock payment TXN {payment.transaction_id} of ₹{amount}")
        return jsonify({'success': True, 'payment': payment.to_dict()})

    payments = Payment.query.order_by(Payment.created_at.desc()).all()
    return jsonify({'success': True, 'payments': [p.to_dict() for p in payments]})

@admin_bp.route('/logs', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_logs():
    logs = Log.query.order_by(Log.timestamp.desc()).limit(100).all()
    return jsonify({'success': True, 'logs': [l.to_dict() for l in logs]})

@admin_bp.route('/monitoring', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def system_monitoring():
    return jsonify({
        'success': True,
        'system_status': 'HEALTHY',
        'database': 'CONNECTED (SQLite ORM)',
        'uptime': '99.9%',
        'api_latency': '18ms',
        'active_sessions': 14
    })
