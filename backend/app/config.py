
import os
from datetime import timedelta

BASE_DIR = os.path.abspath(
    os.path.dirname(os.path.dirname(__file__))
)
DB_PATH = os.path.abspath(
    os.path.join(BASE_DIR, '..', 'database', 'food_rescue.db')
)


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    database_url = os.environ.get('DATABASE_URL')

    if database_url:
        # Render PostgreSQL connection
        if database_url.startswith('postgres://'):
            database_url = database_url.replace(
                'postgres://', 'postgresql+psycopg://', 1
            )
        elif database_url.startswith('postgresql://'):
            database_url = database_url.replace(
                'postgresql://', 'postgresql+psycopg://', 1
            )

        SQLALCHEMY_DATABASE_URI = database_url
    else:
        # Local development uses SQLite
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{DB_PATH}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
