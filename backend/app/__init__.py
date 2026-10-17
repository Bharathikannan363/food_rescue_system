
import os
from flask import Flask, send_from_directory

from app.config import Config
from app.extensions import db, jwt, cors
from app.routes import (
    auth_bp,
    admin_bp,
    donor_bp,
    ngo_bp,
    volunteer_bp,
    notification_bp,
    location_bp,
)


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    os.makedirs(
        os.path.join(app.config["UPLOAD_FOLDER"], "food"),
        exist_ok=True,
    )
    os.makedirs(
        os.path.join(app.config["UPLOAD_FOLDER"], "delivery"),
        exist_ok=True,
    )
    os.makedirs(
        os.path.join(app.config["UPLOAD_FOLDER"], "beneficiaries"),
        exist_ok=True,
    )

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(donor_bp)
    app.register_blueprint(ngo_bp)
    app.register_blueprint(volunteer_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(location_bp)

    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(
            app.config["UPLOAD_FOLDER"], filename
        )

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return {
            "status": "OK",
            "system": "Food Rescue & Redistribution System Backend API",
        }, 200

    with app.app_context():
        db.create_all()

    return app
