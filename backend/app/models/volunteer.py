
from app.extensions import db


class Volunteer(db.Model):
    __tablename__ = "volunteers"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True
    )

    full_name = db.Column(
        db.String(150),
        nullable=False
    )

    vehicle_type = db.Column(
        db.String(50),
        nullable=True,
        default="Bike"
    )

    address = db.Column(
        db.String(255),
        nullable=True
    )

    is_available = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    latitude = db.Column(
        db.Float,
        nullable=True
    )

    longitude = db.Column(
        db.Float,
        nullable=True
    )

    # Volunteer assignments
    assignments = db.relationship(
        "Assignment",
        backref="volunteer",
        lazy=True
    )

    # Volunteer GPS history
    locations = db.relationship(
        "VolunteerLocation",
        backref="volunteer",
        lazy=True,
        cascade="all, delete-orphan",
        order_by="VolunteerLocation.timestamp.desc()"
    )

    def to_dict(self):

        user = self.user

        return {
            "id": self.id,
            "user_id": self.user_id,

            "username": (
                user.username
                if user else None
            ),

            "email": (
                user.email
                if user else None
            ),

            "phone": (
                user.phone
                if user else None
            ),

            "role": (
                user.role
                if user else None
            ),

            "is_approved": (
                user.is_approved
                if user else False
            ),

            "approval_status": (
                user.approval_status
                if user else None
            ),

            "full_name": self.full_name,
            "vehicle_type": self.vehicle_type,
            "address": self.address,
            "is_available": self.is_available,
            "latitude": self.latitude,
            "longitude": self.longitude
        }

    def __repr__(self):
        return (
            f"<Volunteer "
            f"id={self.id} "
            f"name={self.full_name!r}>"
        )
