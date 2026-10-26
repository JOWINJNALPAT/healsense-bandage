import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app, g
from app.models.user import User
from app.models.audit_log import AuditLog
from app.extensions import db

def generate_token(user: User) -> str:
    """Generate JWT token with expiration and role claims."""
    expiration = datetime.now(timezone.utc) + timedelta(hours=current_app.config.get('JWT_EXPIRATION_HOURS', 24))
    payload = {
        'sub': str(user.id),
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'exp': expiration,
        'iat': datetime.now(timezone.utc)
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    return token

def decode_token(token: str) -> dict:
    """Decode and validate JWT token."""
    try:
        return jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required. Missing or malformed token.'}), 401
            
        token = auth_header.split(' ')[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired session token. Please sign in again.'}), 401
            
        user = db.session.get(User, int(payload['sub']))
        if not user or not user.is_active:
            return jsonify({'error': 'Account inactive or not found.'}), 401
            
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

def role_required(*roles):
    """Enforce role-based access control (e.g. 'doctor', 'staff')."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Authentication required.'}), 401
                
            token = auth_header.split(' ')[1]
            payload = decode_token(token)
            if not payload:
                return jsonify({'error': 'Invalid or expired session token.'}), 401
                
            user = db.session.get(User, int(payload['sub']))
            if not user or not user.is_active:
                return jsonify({'error': 'User not found or deactivated.'}), 401
                
            if user.role not in roles:
                return jsonify({'error': f'Forbidden: Role {user.role} is not authorized for this clinical action.'}), 403
                
            g.current_user = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_audit_action(action: str, entity_type: str, entity_id: int = None, metadata: dict = None):
    """Record an audit trail event for clinical security and record changes."""
    try:
        actor_id = getattr(g, 'current_user', None)
        actor_id = actor_id.id if actor_id else None
        log = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id
        )
        if metadata:
            log.change_metadata = metadata
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        current_app.logger.warning(f"Failed to record audit log: {e}")
