
from datetime import datetime

from app.extensions import db


class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    month = db.Column(
        db.String(20),
        nullable=False
    )

    year = db.Column(
        db.Integer,
        nullable=False
    )

    total_donations = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    total_deliveries = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    beneficiaries = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    food_saved = db.Column(
        db.String(50),
        nullable=False,
        default="0 kg"
    )

    generated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "month": self.month,
            "year": self.year,
            "total_donations": self.total_donations,
            "total_deliveries": self.total_deliveries,
            "beneficiaries": self.beneficiaries,
            "food_saved": self.food_saved,
            "generated_at": (
                self.generated_at.isoformat()
                if self.generated_at
                else None
            )
        }

    def __repr__(self):
        return (
            f"<Report "
            f"id={self.id} "
            f"month={self.month} "
            f"year={self.year}>"
        )
