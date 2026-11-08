
from app.extensions import db


class Delivery(db.Model):
    __tablename__ = "deliveries"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    assignment_id = db.Column(
        db.Integer,
        db.ForeignKey("assignments.id"),
        nullable=False,
        unique=True,
        index=True
    )

    pickup_time = db.Column(
        db.DateTime,
        nullable=True
    )

    delivery_time = db.Column(
        db.DateTime,
        nullable=True
    )

    pickup_latitude = db.Column(
        db.Float,
        nullable=True
    )

    pickup_longitude = db.Column(
        db.Float,
        nullable=True
    )

    delivery_latitude = db.Column(
        db.Float,
        nullable=True
    )

    delivery_longitude = db.Column(
        db.Float,
        nullable=True
    )

    proof_image = db.Column(
        db.String(255),
        nullable=True
    )

    beneficiary_count = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    beneficiary_notes = db.Column(
        db.Text,
        nullable=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="ASSIGNED",
        index=True
    )

    def to_dict(self, include_assignment=False):

        result = {
            "id": self.id,
            "assignment_id": self.assignment_id,

            "pickup_time": (
                self.pickup_time.isoformat()
                if self.pickup_time else None
            ),

            "delivery_time": (
                self.delivery_time.isoformat()
                if self.delivery_time else None
            ),

            "pickup_latitude": self.pickup_latitude,
            "pickup_longitude": self.pickup_longitude,

            "delivery_latitude": self.delivery_latitude,
            "delivery_longitude": self.delivery_longitude,

            "proof_image": self.proof_image,
            "beneficiary_count": self.beneficiary_count,
            "beneficiary_notes": self.beneficiary_notes,
            "status": self.status
        }

        if include_assignment:
            result["assignment_details"] = (
                self.assignment.to_dict()
                if self.assignment else None
            )

        return result

    def __repr__(self):
        return (
            f"<Delivery "
            f"id={self.id} "
            f"assignment_id={self.assignment_id} "
            f"status={self.status}>"
        )
