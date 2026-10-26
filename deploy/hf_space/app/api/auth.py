from flask import Blueprint, request, jsonify, g
from app.models.user import User
from app.auth.utils import generate_token, login_required, log_audit_action
from app.extensions import db

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new clinician or staff account."""
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'doctor').strip().lower()

    if not name:
        return jsonify({'error': 'Full name is required.'}), 400
    if not email or '@' not in email:
        return jsonify({'error': 'A valid medical email address is required.'}), 400
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long.'}), 400
    if role not in ('doctor', 'staff'):
        return jsonify({'error': 'Role must be either "doctor" or "staff".'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'An account with this email already exists.'}), 409

    new_user = User(
        name=name,
        email=email,
        role=role,
        is_active=True
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    token = generate_token(new_user)
    log_audit_action('USER_REGISTER', 'User', new_user.id, {'email': new_user.email, 'role': new_user.role, 'name': new_user.name})

    return jsonify({
        'message': 'Account created successfully.',
        'token': token,
        'user': new_user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email address or password.'}), 401

    if not user.is_active:
        return jsonify({'error': 'User account is deactivated. Contact medical administrator.'}), 403

    token = generate_token(user)
    log_audit_action('USER_LOGIN', 'User', user.id, {'email': user.email, 'role': user.role})

    return jsonify({
        'token': token,
        'user': user.to_dict()
    })

@auth_bp.route('/demo-login', methods=['POST'])
def demo_login():
    """Allows instant login for testing either Doctor or Staff accounts."""
    data = request.get_json() or {}
    requested_role = data.get('role', 'doctor').lower()
    
    target_email = 'doctor@healsense.med' if requested_role == 'doctor' else 'nurse@healsense.med'
    user = User.query.filter_by(email=target_email).first()
    
    if not user:
        # Fallback to any active user with that role
        user = User.query.filter_by(role=requested_role).first()
        
    if not user:
        return jsonify({'error': f'No demo account found for role {requested_role}. Run db seed.'}), 404

    token = generate_token(user)
    return jsonify({
        'token': token,
        'user': user.to_dict(),
        'is_demo': True
    })

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'user': g.current_user.to_dict()
    })

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    log_audit_action('USER_LOGOUT', 'User', g.current_user.id)
    return jsonify({'message': 'Logged out successfully.'})
