
from datetime import datetime

from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    username = db.Column(
        db.String(80),
        unique=True,
        nullable=False,
        index=True
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = db.Column(
        db.String(256),
        nullable=False
    )

    role = db.Column(
        db.String(20),
        nullable=False,
        index=True
    )

    phone = db.Column(
        db.String(20),
        nullable=True
    )

    is_approved = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    approval_status = db.Column(
        db.String(20),
        nullable=False,
        default="PENDING",
        index=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # User profiles
    donor_profile = db.relationship(
        "Donor",
        backref="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    ngo_profile = db.relationship(
        "NGO",
        backref="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    volunteer_profile = db.relationship(
        "Volunteer",
        backref="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # Notifications
    notifications = db.relationship(
        "Notification",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan"
    )

    # Activity logs
    logs = db.relationship(
        "Log",
        backref="user",
        lazy=True
    )

    def set_password(self, password):
        if not password:
            raise ValueError("Password cannot be empty")

        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not password or not self.password_hash:
            return False

        return check_password_hash(
            self.password_hash,
            password
        )

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "phone": self.phone,
            "is_approved": self.is_approved,
            "approval_status": self.approval_status,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }

    def __repr__(self):
        return (
            f"<User "
            f"id={self.id} "
            f"username={self.username!r} "
            f"role={self.role}>"
        )
