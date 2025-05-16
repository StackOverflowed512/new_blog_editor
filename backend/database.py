from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    """
    Initializes the database with the Flask app.
    SQLALCHEMY_DATABASE_URI and SQLALCHEMY_TRACK_MODIFICATIONS
    are expected to be set in app.config.
    """
    db.init_app(app)

    with app.app_context():
        # This creates tables for all models defined that inherit from db.Model
        # if they don't already exist.
        db.create_all()
        print("Database tables created or already exist.")