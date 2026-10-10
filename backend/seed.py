import os
from datetime import datetime, timedelta
from app import create_app
from app.extensions import db
from app.models import (
    User, Donor, NGO, Volunteer, Donation,
    Request as FoodRequest, Assignment, Delivery,
    VolunteerLocation, Report, Log, Notification
)
app = create_app()
def seed_database():
    with app.app_context():
        print("Cleaning and seeding fresh database records...")
        db.drop_all()
        db.create_all()

        # 1. Create Admin User
        admin_user = User(
            username='admin',
            email='admin@foodrescue.org',
            role='ADMIN',
            phone='+919876543210',
            is_approved=True,
            approval_status='APPROVED'
        )
        admin_user.set_password('Admin@123')
        db.session.add(admin_user)

        # 2. Create Donor User & Profile
        donor_user = User(
            username='donor',
            email='donor@hotelgrand.com',
            role='DONOR',
            phone='+919876543211',
            is_approved=True,
            approval_status='APPROVED'
        )
        donor_user.set_password('Donor@123')
        db.session.add(donor_user)
        db.session.flush()

        donor_profile = Donor(
            user_id=donor_user.id,
            organization_name='Grand Palace Hotel & Catering',
            address='123 Hospitality Avenue, Sector 18, City Center',
            latitude=28.6139,
            longitude=77.2090
        )
        db.session.add(donor_profile)

        # 3. Create NGO Users & Profiles (NGO 1, NGO 2, NGO 3)
        ngo_user = User(
            username='ngo',
            email='contact@hopefoundation.org',
            role='NGO',
            phone='+919876543212',
            is_approved=True,
            approval_status='APPROVED'
        )
        ngo_user.set_password('Ngo@123')
        db.session.add(ngo_user)
        db.session.flush()

        ngo_profile = NGO(
            user_id=ngo_user.id,
            ngo_name='Hope & Care Shelter Foundation (NGO 1)',
            registration_number='NGO-REG-2024-8890',
            address='45 Compassion Road, Block B, Relief Colony',
            latitude=28.6250,
            longitude=77.2180
        )
        db.session.add(ngo_profile)

        # NGO 2
        ngo2_user = User(
            username='ngo2',
            email='contact@annapoorna.org',
            role='NGO',
            phone='+919876543216',
            is_approved=True,
            approval_status='APPROVED'
        )
        ngo2_user.set_password('Ngo@123')
        db.session.add(ngo2_user)
        db.session.flush()

        ngo2_profile = NGO(
            user_id=ngo2_user.id,
            ngo_name='Annapoorna Food Relief (NGO 2)',
            registration_number='NGO-REG-2024-9102',
            address='12 Harmony Street, West Delhi',
            latitude=28.6320,
            longitude=77.2200
        )
        db.session.add(ngo2_profile)

        # NGO 3
        ngo3_user = User(
            username='ngo3',
            email='seva@communitykitchen.org',
            role='NGO',
            phone='+919876543217',
            is_approved=True,
            approval_status='APPROVED'
        )
        ngo3_user.set_password('Ngo@123')
        db.session.add(ngo3_user)
        db.session.flush()

        ngo3_profile = NGO(
            user_id=ngo3_user.id,
            ngo_name='Seva Community Kitchen (NGO 3)',
            registration_number='NGO-REG-2024-7744',
            address='88 Seva Marg, South Extension',
            latitude=28.5700,
            longitude=77.2250
        )
        db.session.add(ngo3_profile)

        # 4. Create Volunteer Users & Profiles (Volunteer 1, Volunteer 2, Volunteer 3)
        vol_user = User(
            username='volunteer',
            email='alex.volunteer@gmail.com',
            role='VOLUNTEER',
            phone='+919876543213',
            is_approved=True,
            approval_status='APPROVED'
        )
        vol_user.set_password('Volunteer@123')
        db.session.add(vol_user)
        db.session.flush()

        vol_profile = Volunteer(
            user_id=vol_user.id,
            full_name='Alex Rivera (Volunteer 1)',
            vehicle_type='Delivery Van',
            address='78 Green Park Extension, Metro Lane',
            is_available=True,
            latitude=28.6180,
            longitude=77.2130
        )
        db.session.add(vol_profile)

        # Second volunteer - farther from pickup point
        vol2_user = User(
            username='volunteer2',
            email='priya.volunteer@gmail.com',
            role='VOLUNTEER',
            phone='+919876543214',
            is_approved=True,
            approval_status='APPROVED'
        )
        vol2_user.set_password('Volunteer@123')
        db.session.add(vol2_user)
        db.session.flush()

        vol2_profile = Volunteer(
            user_id=vol2_user.id,
            full_name='Priya Sharma (Volunteer 2)',
            vehicle_type='Scooter',
            address='219 Ridge Road, Civil Lines Quarters',
            is_available=True,
            latitude=28.6250,
            longitude=77.2180
        )
        db.session.add(vol2_profile)

        # Third volunteer - approved but no static GPS (HTML5 GPS broadcast demo)
        vol3_user = User(
            username='volunteer3',
            email='ravi.volunteer@gmail.com',
            role='VOLUNTEER',
            phone='+919876543215',
            is_approved=True,
            approval_status='APPROVED'
        )
        vol3_user.set_password('Volunteer@123')
        db.session.add(vol3_user)
        db.session.flush()

        vol3_profile = Volunteer(
            user_id=vol3_user.id,
            full_name='Ravi Kumar (Volunteer 3)',
            vehicle_type='Bike',
            address='54 Ashok Vihar, Phase 2',
            is_available=True,
            latitude=None,
            longitude=None
        )
        db.session.add(vol3_profile)

        db.session.commit()

        # 5. Create Sample Donations matching the new workflow
        now = datetime.utcnow()

        # Donation 1: AVAILABLE (NGO 1, NGO 2, NGO 3 can all view and accept)
        donation1 = Donation(
            donor_id=donor_profile.id,
            title='Surplus Buffet Meals & Rice Bowls',
            description='Freshly prepared vegetarian rice bowls, dal, and chapati from evening banquet event.',
            food_type='Cooked Meals',
            quantity='60 Meals',
            pickup_address=donor_profile.address,
            latitude=donor_profile.latitude,
            longitude=donor_profile.longitude,
            prep_time=now - timedelta(hours=2),
            expiry_time=now + timedelta(hours=6),   # FRESH
            status='APPROVED'
        )

        # Donation 2: AVAILABLE (Fresh bakery items)
        donation2 = Donation(
            donor_id=donor_profile.id,
            title='Fresh Bakery Breads & Muffins',
            description='Assorted whole wheat breads, dinner rolls, and fruit muffins baked today.',
            food_type='Bakery Items',
            quantity='35 Packs',
            pickup_address=donor_profile.address,
            latitude=donor_profile.latitude,
            longitude=donor_profile.longitude,
            prep_time=now - timedelta(hours=1),
            expiry_time=now + timedelta(hours=5),   # FRESH
            status='APPROVED'
        )

        # Donation 3: NGO ACCEPTED -> Broadcasted to ALL volunteers! (Ready for Volunteer 1, 2, or 3 to claim)
        donation3 = Donation(
            donor_id=donor_profile.id,
            title='Veg Sandwich Packs - Closing Time Batch',
            description='Fresh sandwiches from the evening counter. NGO 1 has accepted; broadcasted to all volunteers for pickup!',
            food_type='Bakery Items',
            quantity='25 Packs',
            pickup_address=donor_profile.address,
            latitude=donor_profile.latitude,
            longitude=donor_profile.longitude,
            prep_time=now - timedelta(hours=1),
            expiry_time=now + timedelta(hours=3),   # FRESH
            status='NGO_ACCEPTED'
        )

        # Donation 4: EXPIRED (FSSAI compliance check blocks this)
        donation4 = Donation(
            donor_id=donor_profile.id,
            title='Evening Chaat & Snacks - Expired Batch',
            description='Leftover chaat from afternoon stall. Held past safe consumption window.',
            food_type='Cooked Meals',
            quantity='15 Plates',
            pickup_address=donor_profile.address,
            latitude=donor_profile.latitude,
            longitude=donor_profile.longitude,
            prep_time=now - timedelta(hours=8),
            expiry_time=now - timedelta(hours=2),   # EXPIRED
            status='APPROVED'
        )

        # Donation 5: IN TRANSIT (Out for Delivery by Volunteer 1 to NGO 2)
        donation5 = Donation(
            donor_id=donor_profile.id,
            title='Hot Dal & Roti Banquet Pack',
            description='Freshly cooked hot meals. Picked up by volunteer and currently en route to NGO 2.',
            food_type='Cooked Meals',
            quantity='40 Meals',
            pickup_address=donor_profile.address,
            latitude=donor_profile.latitude,
            longitude=donor_profile.longitude,
            prep_time=now - timedelta(hours=3),
            expiry_time=now + timedelta(hours=4),
            status='OUT_FOR_DELIVERY'
        )

        # Donation 6: COMPLETED (Delivered to NGO 3, 50 beneficiaries fed)
        donation6 = Donation(
            donor_id=donor_profile.id,
            title='Breakfast Hampers & Fruit Bowls',
            description='Nutritious breakfast packs distributed to underprivileged families.',
            food_type='Fruits & Veggies',
            quantity='50 Hampers',
            pickup_address=donor_profile.address,
            latitude=donor_profile.latitude,
            longitude=donor_profile.longitude,
            prep_time=now - timedelta(hours=12),
            expiry_time=now - timedelta(hours=1),
            status='COMPLETED'
        )

        db.session.add_all([donation1, donation2, donation3, donation4, donation5, donation6])
        db.session.commit()

        # 6. Create NGO Requests corresponding to accepted/in-transit/completed donations
        # Request for Donation 3: NGO 1 Accepted, awaiting volunteer claim
        req3 = FoodRequest(
            donation_id=donation3.id,
            ngo_id=ngo_profile.id,
            status='ACCEPTED',
            quality_status='VERIFIED',
            quality_notes='Verified safe packaging and optimal food temperature.',
            requested_at=now - timedelta(minutes=15),
            responded_at=now - timedelta(minutes=15)
        )

        # Request for Donation 5: NGO 2 Accepted, assigned to Volunteer 1, OUT_FOR_DELIVERY
        req5 = FoodRequest(
            donation_id=donation5.id,
            ngo_id=ngo2_profile.id,
            status='ACCEPTED',
            quality_status='VERIFIED',
            quality_notes='Verified hygiene and sealed containers.',
            requested_at=now - timedelta(hours=1),
            responded_at=now - timedelta(hours=1)
        )

        # Request for Donation 6: NGO 3 Completed
        req6 = FoodRequest(
            donation_id=donation6.id,
            ngo_id=ngo3_profile.id,
            status='COMPLETED',
            quality_status='VERIFIED',
            quality_notes='High quality fresh fruits distributed.',
            requested_at=now - timedelta(hours=5),
            responded_at=now - timedelta(hours=5)
        )

        db.session.add_all([req3, req5, req6])
        db.session.commit()

        # 7. Create Assignments & Deliveries for in-transit and completed donations
        # Assignment for Donation 5: Volunteer 1 on active delivery duty
        assign5 = Assignment(
            request_id=req5.id,
            volunteer_id=vol_profile.id,
            status='OUT_FOR_DELIVERY',
            assigned_at=now - timedelta(minutes=45),
            accepted_at=now - timedelta(minutes=40)
        )
        db.session.add(assign5)
        db.session.flush()

        delivery5 = Delivery(
            assignment_id=assign5.id,
            pickup_time=now - timedelta(minutes=30),
            pickup_latitude=donor_profile.latitude,
            pickup_longitude=donor_profile.longitude,
            status='OUT_FOR_DELIVERY'
        )
        db.session.add(delivery5)

        # Assignment for Donation 6: Volunteer 2 completed run
        assign6 = Assignment(
            request_id=req6.id,
            volunteer_id=vol2_profile.id,
            status='COMPLETED',
            assigned_at=now - timedelta(hours=4),
            accepted_at=now - timedelta(hours=4)
        )
        db.session.add(assign6)
        db.session.flush()

        delivery6 = Delivery(
            assignment_id=assign6.id,
            pickup_time=now - timedelta(hours=3),
            delivery_time=now - timedelta(hours=2),
            pickup_latitude=donor_profile.latitude,
            pickup_longitude=donor_profile.longitude,
            delivery_latitude=ngo3_profile.latitude,
            delivery_longitude=ngo3_profile.longitude,
            beneficiary_count=50,
            beneficiary_notes='Distributed to 50 children and senior citizens.',
            status='COMPLETED'
        )
        db.session.add(delivery6)

        # 8. Volunteer live GPS ping records
        vol_loc = VolunteerLocation(
            volunteer_id=vol_profile.id,
            latitude=28.6200,
            longitude=77.2140
        )
        vol2_loc = VolunteerLocation(
            volunteer_id=vol2_profile.id,
            latitude=28.6250,
            longitude=77.2180
        )
        db.session.add_all([vol_loc, vol2_loc])

        # 9. Create Notifications for Volunteers announcing open task
        for v in [vol_user, vol2_user, vol3_user]:
            n = Notification(
                user_id=v.id,
                title="New Food Delivery Available!",
                message=f"Surplus food '{donation3.title}' (25 Packs) accepted by NGO 1. Broadcasted to all volunteers - first to accept claims it!",
                type="INFO"
            )
            db.session.add(n)

        # 10. Reports, Payments, and Audit Logs
        rep = Report(
            month='April',
            year=2026,
            total_donations=32,
            total_deliveries=28,
            beneficiaries=530,
            food_saved='80.0 kg'
        )
        
        log1 = Log(
            user_id=admin_user.id,
            action="SYSTEM_INIT",
            entity_type="System",
            entity_id=1,
            description="Initialized Food Rescue System with Broadcast Workflow: NGO 1/2/3 and Volunteer 1/2/3."
        )
        db.session.add_all([rep, log1])
        db.session.commit()

        print("==================================================")
        print(" Database Seeded Successfully with Broadcast Workflow!")
        print(" Demo Credentials:")
        print("  - Admin:       username: admin      password: Admin@123")
        print("  - Donor:       username: donor      password: Donor@123")
        print("  - NGO 1:       username: ngo        password: Ngo@123")
        print("  - NGO 2:       username: ngo2       password: Ngo@123")
        print("  - NGO 3:       username: ngo3       password: Ngo@123")
        print("  - Volunteer 1: username: volunteer  password: Volunteer@123")
        print("  - Volunteer 2: username: volunteer2 password: Volunteer@123")
        print("  - Volunteer 3: username: volunteer3 password: Volunteer@123")
        print("==================================================")

if __name__ == '__main__':
    seed_database()
