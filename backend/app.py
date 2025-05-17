import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import datetime # For JWT expiration delta

# Relative imports, work because 'backend' is a package (due to __init__.py)
from .database import init_db, db
from .models import Blog, User
from .auth import token_required, register_user, login_user

# Load environment variables from .env or .flaskenv
# This should be called early, before create_app if possible, or within it.
load_dotenv()

# Define the base directory of the backend application
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

def create_app(test_config=None):
    """Create and configure an instance of the Flask application."""
    
    # Configure instance_path to be an 'instance' folder inside BASE_DIR (backend/)
    # This is where Flask will look for instance-specific config files and the SQLite DB.
    instance_folder_path = os.path.join(BASE_DIR, 'instance')
    
    app = Flask(__name__, instance_path=instance_folder_path)

    # --- Configuration ---
    # Load default configuration (can be from a config.py file or directly here)
    app.config.from_mapping(
        SECRET_KEY=os.getenv('SECRET_KEY', 'dev_secret_key_change_me_for_prod'), # General Flask secret key
        JWT_SECRET_KEY=os.getenv('JWT_SECRET_KEY', 'jwt_secret_key_fallback_change_me'),
        JWT_EXPIRATION_DELTA_HOURS=24, # How long tokens are valid
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    # Determine database URI
    # Default to SQLite in the instance folder
    default_db_filename = 'blog.db'
    default_db_path = os.path.join(app.instance_path, default_db_filename)
    # Use DATABASE_URL from .flaskenv if set, otherwise use the default path
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f"sqlite:///{default_db_path}")

    if test_config is None:
        # Load the instance config, if it exists, when not testing
        # app.config.from_pyfile('config.py', silent=True) # If you have an instance/config.py
        pass
    else:
        # Load the test config if passed in
        app.config.update(test_config)

    # Ensure the instance folder exists (Flask doesn't always create it for db connections)
    try:
        os.makedirs(app.instance_path, exist_ok=True)
        print(f"Instance path ensured/created at: {app.instance_path}")
        print(f"Database URI set to: {app.config['SQLALCHEMY_DATABASE_URI']}")
    except OSError as e:
        # Log this error, as it might prevent the DB from being created
        app.logger.error(f"Error creating instance directory {app.instance_path}: {e}")
        # Depending on severity, you might want to raise an error or exit here.

    # --- Initialize Extensions ---
    CORS(app, 
         resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "http://localhost:3000").split(',')}}, 
         supports_credentials=True
    )
    init_db(app) # Initialize SQLAlchemy and create tables

    # --- Error Handlers ---
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify(message=str(error.description) if hasattr(error, 'description') else "Bad Request"), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify(message=str(error.description) if hasattr(error, 'description') else "Not Found"), 404
    
    @app.errorhandler(500)
    def internal_server_error(error):
        db.session.rollback() # Rollback session in case of DB error during request
        app.logger.error(f"Server Error: {error}, Path: {request.path}")
        return jsonify(message="An internal server error occurred."), 500


    # --- Authentication Routes ---
    @app.route('/api/auth/register', methods=['POST'])
    def auth_register_route():
        return register_user()

    @app.route('/api/auth/login', methods=['POST'])
    def auth_login_route():
        return login_user()

    @app.route('/api/auth/me', methods=['GET'])
    @token_required
    def get_current_user_route(current_user): # Renamed to avoid conflict
        return jsonify(current_user.to_dict()), 200

    # --- Blog Routes ---
    @app.route('/api/blogs/save-draft', methods=['POST'])
    @token_required
    def save_draft_route(current_user): # Renamed
        data = request.get_json()
        if not data:
            return jsonify(message="Request body is missing JSON"), 400

        blog_id = data.get('id')
        title = data.get('title', '') # Default to empty string if not provided
        content = data.get('content', '') # Default to empty string
        tags_input = data.get('tags', [])
        
        # Ensure tags are processed correctly whether it's a list or a string
        if isinstance(tags_input, str):
            tags_list = [tag.strip() for tag in tags_input.split(',') if tag.strip()]
        elif isinstance(tags_input, list):
            tags_list = [str(tag).strip() for tag in tags_input if str(tag).strip()]
        else:
            tags_list = []
        tags_string = ",".join(tags_list)


        if blog_id: 
            blog = Blog.query.filter_by(id=blog_id, user_id=current_user.id).first()
            if not blog:
                return jsonify({'message': 'Draft not found or not authorized to edit.'}), 404
            blog.title = title
            blog.content = content
            blog.tags = tags_string
            blog.status = 'draft' # Explicitly set to draft
        else: 
            blog = Blog(
                title=title,
                content=content,
                tags=tags_string,
                status='draft',
                user_id=current_user.id
            )
            db.session.add(blog)
        
        try:
            db.session.commit()
            return jsonify(blog.to_dict()), 200 if blog_id else 201
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error saving draft: {e}")
            return jsonify(message="Failed to save draft."), 500


    @app.route('/api/blogs/publish', methods=['POST'])
    @token_required
    def publish_blog_route(current_user): # Renamed
        data = request.get_json()
        if not data:
            return jsonify(message="Request body is missing JSON"), 400

        title = data.get('title')
        content = data.get('content')
        
        if not title or not content: # Stricter validation for publishing
            return jsonify({'message': 'Title and content are required to publish.'}), 400

        blog_id = data.get('id')
        tags_input = data.get('tags', [])
        if isinstance(tags_input, str):
            tags_list = [tag.strip() for tag in tags_input.split(',') if tag.strip()]
        elif isinstance(tags_input, list):
            tags_list = [str(tag).strip() for tag in tags_input if str(tag).strip()]
        else:
            tags_list = []
        tags_string = ",".join(tags_list)

        if blog_id: 
            blog = Blog.query.filter_by(id=blog_id, user_id=current_user.id).first()
            if not blog:
                return jsonify({'message': 'Blog not found or not authorized to publish.'}), 404
            blog.title = title
            blog.content = content
            blog.tags = tags_string
            blog.status = 'published'
        else: 
            blog = Blog(
                title=title,
                content=content,
                tags=tags_string,
                status='published',
                user_id=current_user.id
            )
            db.session.add(blog)
            
        try:
            db.session.commit()
            return jsonify(blog.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error publishing blog: {e}")
            return jsonify(message="Failed to publish blog."), 500

    @app.route('/api/blogs', methods=['GET'])
    def get_all_blogs_route(): # Renamed
        status_filter = request.args.get('status')
        user_id_filter = request.args.get('user_id')
        
        query = Blog.query
        
        if status_filter:
            query = query.filter(Blog.status == status_filter) # Use == for SQLAlchemy filters
        if user_id_filter:
            try:
                user_id = int(user_id_filter)
                query = query.filter(Blog.user_id == user_id)
            except ValueError:
                return jsonify(message="Invalid user_id format."), 400
            
        blogs = query.order_by(Blog.updated_at.desc()).all()
        return jsonify([blog.to_dict() for blog in blogs]), 200

    @app.route('/api/blogs/<int:blog_id_param>', methods=['GET']) # Renamed param to avoid conflict
    def get_blog_by_id_route(blog_id_param): # Renamed
        blog = Blog.query.get(blog_id_param)
        if not blog:
            return jsonify({'message': 'Blog not found.'}), 404
        # For public view, ensure it's published or owned by current user (if auth is checked later)
        # if blog.status != 'published' and (not current_user_is_available or blog.user_id != current_user_is_available.id):
        #    return jsonify({'message': 'Blog not found or access denied.'}), 404
        return jsonify(blog.to_dict()), 200
    
    @app.route('/api/blogs/<int:blog_id_param>', methods=['DELETE']) # Renamed param
    @token_required
    def delete_blog_route(current_user, blog_id_param): # Renamed
        blog = Blog.query.filter_by(id=blog_id_param, user_id=current_user.id).first()
        if not blog:
            return jsonify({'message': 'Blog not found or not authorized to delete.'}), 404
        
        try:
            db.session.delete(blog)
            db.session.commit()
            return jsonify({'message': 'Blog deleted successfully.'}), 200
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error deleting blog: {e}")
            return jsonify(message="Failed to delete blog."), 500

    return app

# This allows running with `python app.py` for simple testing,
# but `flask run` using the factory pattern is preferred for development.
if __name__ == '__main__':
    app = create_app()
    # Use a different port if your frontend is on 5000 to avoid conflicts.
    # The port in .flaskenv for `flask run` will also need to be consistent.
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5001)), debug=os.getenv('FLASK_DEBUG') == '1')
