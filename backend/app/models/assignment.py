
from datetime import datetime

from app.extensions import db


class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    request_id = db.Column(
        db.Integer,
        db.ForeignKey("requests.id"),
        nullable=False,
        index=True
    )

    volunteer_id = db.Column(
        db.Integer,
        db.ForeignKey("volunteers.id"),
        nullable=False,
        index=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="ASSIGNED",
        index=True
    )

    assigned_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    accepted_at = db.Column(
        db.DateTime,
        nullable=True
    )

    rejected_at = db.Column(
        db.DateTime,
        nullable=True
    )

    # Related delivery records.
    # Preserves the existing one-to-many relationship.
    deliveries = db.relationship(
        "Delivery",
        backref="assignment",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self):

        volunteer = self.volunteer

        volunteer_user = (
            volunteer.user if volunteer else None
        )

        food_request = self.request

        request_details = None

        if food_request:
            request_details = {
                "id": food_request.id,
                "donation_id": food_request.donation_id,
                "ngo_id": food_request.ngo_id,
                "status": food_request.status,
                "quality_status": food_request.quality_status
            }

        return {
            "id": self.id,
            "request_id": self.request_id,
            "volunteer_id": self.volunteer_id,

            "volunteer_name": (
                volunteer.full_name
                if volunteer else "Volunteer"
            ),

            "volunteer_phone": (
                volunteer_user.phone
                if volunteer_user else None
            ),

            "vehicle_type": (
                volunteer.vehicle_type
                if volunteer else None
            ),

            "status": self.status,

            "assigned_at": (
                self.assigned_at.isoformat()
                if self.assigned_at else None
            ),

            "accepted_at": (
                self.accepted_at.isoformat()
                if self.accepted_at else None
            ),

            "rejected_at": (
                self.rejected_at.isoformat()
                if self.rejected_at else None
            ),

            "request_details": request_details
        }

    def __repr__(self):
        return (
            f"<Assignment "
            f"id={self.id} "
            f"volunteer_id={self.volunteer_id} "
            f"status={self.status}>"
        )
