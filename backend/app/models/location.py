
from datetime import datetime

from app.extensions import db


class VolunteerLocation(db.Model):
    __tablename__ = "volunteer_locations"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    volunteer_id = db.Column(
        db.Integer,
        db.ForeignKey("volunteers.id"),
        nullable=False,
        index=True
    )

    latitude = db.Column(
        db.Float,
        nullable=False
    )

    longitude = db.Column(
        db.Float,
        nullable=False
    )

    timestamp = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "volunteer_id": self.volunteer_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timestamp": (
                self.timestamp.isoformat()
                if self.timestamp
                else None
            )
        }

    def __repr__(self):
        return (
            f"<VolunteerLocation "
            f"id={self.id} "
            f"volunteer_id={self.volunteer_id}>"
        )
