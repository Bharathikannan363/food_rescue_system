
from datetime import datetime

from app.extensions import db


class Log(db.Model):
    __tablename__ = "logs"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    action = db.Column(
        db.String(100),
        nullable=False
    )

    entity_type = db.Column(
        db.String(50),
        nullable=True
    )

    entity_id = db.Column(
        db.Integer,
        nullable=True
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    ip_address = db.Column(
        db.String(45),
        nullable=True
    )

    timestamp = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True
    )

    def to_dict(self):
        user_info = (
            self.user.to_dict()
            if self.user
            else {}
        )

        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": user_info.get("username") or "System",
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "description": self.description,
            "ip_address": self.ip_address,
            "timestamp": (
                self.timestamp.isoformat()
                if self.timestamp
                else None
            )
        }

    def __repr__(self):
        return (
            f"<Log "
            f"id={self.id} "
            f"action={self.action!r} "
            f"user_id={self.user_id}>"
        )
