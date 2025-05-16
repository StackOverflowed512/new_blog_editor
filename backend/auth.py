import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app
from .models import User, db # Relative import
from .database import db # Ensure db is accessible if User model uses it for queries

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'Token is invalid or user not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def register_user():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Request body is missing JSON'}), 400
        
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 409

    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

def login_user():
    auth_data = request.get_json()
    if not auth_data:
        # Try Basic Auth as a fallback if no JSON body
        auth = request.authorization
        if not auth or not auth.username or not auth.password:
            return jsonify({'message': 'Could not verify, missing credentials'}), 401, {'WWW-Authenticate': 'Basic realm="Login required!"'}
        username = auth.username
        password = auth.password
    else:
        username = auth_data.get('username')
        password = auth_data.get('password')
        if not username or not password:
            return jsonify({'message': 'Username and password required in JSON body'}), 400
        
    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({'message': 'Login failed! Check credentials'}), 401

    token_payload = {
        'user_id': user.id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=current_app.config.get('JWT_EXPIRATION_DELTA_HOURS', 24))
    }
    token = jwt.encode(token_payload, current_app.config['JWT_SECRET_KEY'], algorithm="HS256")
    
    return jsonify({'token': token, 'user': user.to_dict()})