
from datetime import datetime, timedelta

from app.extensions import db


class Donation(db.Model):
    __tablename__ = "donations"

    EXPIRING_SOON_THRESHOLD = timedelta(hours=2)

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    donor_id = db.Column(
        db.Integer,
        db.ForeignKey("donors.id"),
        nullable=False,
        index=True
    )

    title = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    food_type = db.Column(
        db.String(50),
        nullable=False
    )

    quantity = db.Column(
        db.String(50),
        nullable=False
    )

    image = db.Column(
        db.String(255),
        nullable=True
    )

    pickup_address = db.Column(
        db.String(255),
        nullable=False
    )

    latitude = db.Column(
        db.Float,
        nullable=True
    )

    longitude = db.Column(
        db.Float,
        nullable=True
    )

    allowed_ngo_id = db.Column(
        db.Integer,
        db.ForeignKey("ngos.id"),
        nullable=True
    )

    prep_time = db.Column(
        db.DateTime,
        nullable=True
    )

    expiry_time = db.Column(
        db.DateTime,
        nullable=True,
        index=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="PENDING_ADMIN_APPROVAL",
        index=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    cancelled_at = db.Column(
        db.DateTime,
        nullable=True
    )

    # Requests associated with this donation
    requests = db.relationship(
        "Request",
        backref="donation",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def expiry_state(self):
        if not self.expiry_time:
            return "NO_EXPIRY_INFO"

        now = datetime.utcnow()

        if now >= self.expiry_time:
            return "EXPIRED"

        if (
            self.expiry_time - now
            <= self.EXPIRING_SOON_THRESHOLD
        ):
            return "EXPIRING_SOON"

        return "FRESH"

    def to_dict(self):

        donor = self.donor

        donor_user = (
            donor.user
            if donor else None
        )

        # Find the accepted NGO request
        accepted_req = next(
            (
                req
                for req in self.requests
                if req.status in ["ACCEPTED", "COMPLETED"]
            ),
            None
        )

        accepted_ngo_name = None
        accepted_ngo_id = None
        assigned_vol_name = None

        if accepted_req:

            accepted_ngo = accepted_req.ngo

            if accepted_ngo:
                accepted_ngo_id = accepted_ngo.id
                accepted_ngo_name = accepted_ngo.ngo_name

            # Find the active volunteer assignment
            active_assignment = next(
                (
                    assignment
                    for assignment in accepted_req.assignments
                    if assignment.status in [
                        "ASSIGNED",
                        "ACCEPTED",
                        "PICKED_UP",
                        "OUT_FOR_DELIVERY",
                        "DELIVERED",
                        "COMPLETED"
                    ]
                ),
                None
            )

            if (
                active_assignment
                and active_assignment.volunteer
            ):
                assigned_vol_name = (
                    active_assignment.volunteer.full_name
                )

        return {
            "id": self.id,
            "donor_id": self.donor_id,

            # Donor information
            "donor_name": (
                donor.organization_name
                if donor else "Donor"
            ),

            "donor_phone": (
                donor_user.phone
                if donor_user else None
            ),

            # Donation information
            "title": self.title,
            "description": self.description,
            "food_type": self.food_type,
            "quantity": self.quantity,
            "image": self.image,
            "pickup_address": self.pickup_address,

            "latitude": self.latitude,
            "longitude": self.longitude,

            "allowed_ngo_id": self.allowed_ngo_id,

            "prep_time": (
                self.prep_time.isoformat()
                if self.prep_time else None
            ),

            "expiry_time": (
                self.expiry_time.isoformat()
                if self.expiry_time else None
            ),

            "expiry_state": self.expiry_state(),
            "status": self.status,

            # Assignment information
            "accepted_ngo_id": accepted_ngo_id,
            "accepted_ngo_name": accepted_ngo_name,
            "assigned_volunteer_name": assigned_vol_name,

            # Timestamps
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            ),

            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at else None
            ),

            "cancelled_at": (
                self.cancelled_at.isoformat()
                if self.cancelled_at else None
            )
        }

    def __repr__(self):
        return (
            f"<Donation "
            f"id={self.id} "
            f"title={self.title!r} "
            f"status={self.status}>"
        )
