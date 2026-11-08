
from datetime import datetime

from app.extensions import db


class Request(db.Model):
    __tablename__ = "requests"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    donation_id = db.Column(
        db.Integer,
        db.ForeignKey("donations.id"),
        nullable=False,
        index=True
    )

    ngo_id = db.Column(
        db.Integer,
        db.ForeignKey("ngos.id"),
        nullable=False,
        index=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="PENDING",
        index=True
    )

    quality_status = db.Column(
        db.String(30),
        nullable=False,
        default="VERIFIED"
    )

    quality_notes = db.Column(
        db.Text,
        nullable=True
    )

    requested_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    responded_at = db.Column(
        db.DateTime,
        nullable=True
    )

    # Related assignments
    assignments = db.relationship(
        "Assignment",
        backref="request",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        donation = self.donation
        ngo = self.ngo

        donor = (
            donation.donor
            if donation else None
        )

        donor_user = (
            donor.user
            if donor else None
        )

        ngo_user = (
            ngo.user
            if ngo else None
        )

        return {
            "id": self.id,
            "donation_id": self.donation_id,

            # Donation information
            "donation_title": (
                donation.title
                if donation else None
            ),

            "donation_food_type": (
                donation.food_type
                if donation else None
            ),

            "donation_quantity": (
                donation.quantity
                if donation else None
            ),

            "donation_image": (
                donation.image
                if donation else None
            ),

            "donation_pickup_address": (
                donation.pickup_address
                if donation else None
            ),

            "donor_name": (
                donor.organization_name
                if donor else None
            ),

            "donor_phone": (
                donor_user.phone
                if donor_user else None
            ),

            # NGO information
            "ngo_id": self.ngo_id,

            "ngo_name": (
                ngo.ngo_name
                if ngo else None
            ),

            "ngo_phone": (
                ngo_user.phone
                if ngo_user else None
            ),

            "ngo_address": (
                ngo.address
                if ngo else None
            ),

            # Request information
            "status": self.status,
            "quality_status": self.quality_status,
            "quality_notes": self.quality_notes,

            "requested_at": (
                self.requested_at.isoformat()
                if self.requested_at
                else None
            ),

            "responded_at": (
                self.responded_at.isoformat()
                if self.responded_at
                else None
            )
        }

    def __repr__(self):
        return (
            f"<Request "
            f"id={self.id} "
            f"donation_id={self.donation_id} "
            f"ngo_id={self.ngo_id} "
            f"status={self.status}>"
        )
