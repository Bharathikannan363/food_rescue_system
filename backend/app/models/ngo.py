
from app.extensions import db


class NGO(db.Model):
    __tablename__ = "ngos"

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

    ngo_name = db.Column(
        db.String(150),
        nullable=False
    )

    registration_number = db.Column(
        db.String(50),
        nullable=False,
        unique=True
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

    # Requests associated with this NGO
    requests = db.relationship(
        "Request",
        backref="ngo",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        user_data = (
            self.user.to_dict()
            if self.user
            else {}
        )

        return {
            **user_data,
            "id": self.id,
            "user_id": self.user_id,
            "ngo_name": self.ngo_name,
            "registration_number": self.registration_number,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude
        }

    def __repr__(self):
        return (
            f"<NGO "
            f"id={self.id} "
            f"name={self.ngo_name!r}>"
        )
