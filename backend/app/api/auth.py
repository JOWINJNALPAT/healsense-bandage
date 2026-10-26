from flask import Blueprint, request, jsonify, g
from app.models.user import User
from app.auth.utils import generate_token, login_required, log_audit_action
from app.extensions import db

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

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
