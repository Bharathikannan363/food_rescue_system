
from app.extensions import db


class Donor(db.Model):
    __tablename__ = "donors"

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

    organization_name = db.Column(
        db.String(150),
        nullable=True
    )

    address = db.Column(
        db.String(255),
        nullable=True
    )

    latitude = db.Column(
        db.Float,
        nullable=True
    )

    longitude = db.Column(
        db.Float,
        nullable=True
    )

    # Donations created by this donor
    donations = db.relationship(
        "Donation",
        backref="donor",
        lazy=True,
        cascade="all, delete-orphan"
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

            "organization_name": self.organization_name,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude
        }

    def __repr__(self):
        return (
            f"<Donor "
            f"id={self.id} "
            f"organization={self.organization_name!r}>"
        )
