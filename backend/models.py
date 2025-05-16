from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from .database import db # Relative import works due to __init__.py

class User(db.Model):
    __tablename__ = 'user' # Explicit table name
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship: A user can have many blogs.
    # 'backref' creates a virtual 'author' attribute on the Blog model.
    # 'lazy=True' means blogs are loaded as needed.
    # 'cascade="all, delete-orphan"' means if a User is deleted, their blogs are also deleted.
    blogs = db.relationship('Blog', backref='author', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Blog(db.Model):
    __tablename__ = 'blog' # Explicit table name
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, default='')
    content = db.Column(db.Text, nullable=False, default='')
    tags = db.Column(db.String(200), nullable=True) # Comma-separated
    status = db.Column(db.String(20), nullable=False, default='draft') # 'draft' or 'published'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Foreign Key to link Blog to a User
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'tags': self.tags.split(',') if self.tags else [],
            'status': self.status,
            'user_id': self.user_id,
            'author_username': self.author.username if self.author else "Unknown", # Access through backref
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }