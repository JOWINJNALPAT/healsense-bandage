import json
from flask import Blueprint, request, jsonify, g
from app.models.calibration import CalibrationProfile
from app.auth.utils import login_required, role_required, log_audit_action
from app.extensions import db

calibration_bp = Blueprint('calibration', __name__, url_prefix='/api/calibration-profiles')

@calibration_bp.route('', methods=['GET'])
@login_required
def list_profiles():
    profiles = CalibrationProfile.query.order_by(CalibrationProfile.created_at.desc()).all()
    return jsonify([p.to_dict() for p in profiles])

@calibration_bp.route('/<int:profile_id>', methods=['GET'])
@login_required
def get_profile(profile_id):
    profile = CalibrationProfile.query.get_or_404(profile_id)
    return jsonify(profile.to_dict())

@calibration_bp.route('', methods=['POST'])
@login_required
def create_profile():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    material_batch = data.get('material_batch', '').strip()

    if not name or not material_batch:
        return jsonify({'error': 'Profile name and material batch identifier are required.'}), 400

    ref_data = data.get('reference_data', [])
    exp_metadata = data.get('experiment_metadata', {})
    val_status = data.get('validation_status', 'EXPERIMENTAL').upper()

    profile = CalibrationProfile(
        name=name,
        material_batch=material_batch,
        reference_data_json=json.dumps(ref_data),
        experiment_metadata_json=json.dumps(exp_metadata),
        validation_status=val_status,
        profile_version=data.get('profile_version', '1.0'),
        created_by=g.current_user.id
    )

    db.session.add(profile)
    db.session.commit()

    log_audit_action('CALIBRATION_PROFILE_CREATED', 'CalibrationProfile', profile.id, {
        'name': profile.name,
        'batch': profile.material_batch,
        'status': profile.validation_status
    })

    return jsonify(profile.to_dict()), 201

@calibration_bp.route('/<int:profile_id>', methods=['PATCH'])
@login_required
def update_profile(profile_id):
    profile = CalibrationProfile.query.get_or_404(profile_id)
    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        profile.name = data['name'].strip()
    if 'material_batch' in data and data['material_batch'].strip():
        profile.material_batch = data['material_batch'].strip()
    if 'reference_data' in data and isinstance(data['reference_data'], list):
        profile.reference_data = data['reference_data']
    if 'experiment_metadata' in data and isinstance(data['experiment_metadata'], dict):
        profile.experiment_metadata = data['experiment_metadata']
    if 'validation_status' in data:
        new_val = data['validation_status'].upper()
        if new_val in ('VALIDATED', 'EXPERIMENTAL', 'UNVALIDATED'):
            profile.validation_status = new_val
    if 'profile_version' in data:
        profile.profile_version = data['profile_version']

    db.session.commit()
    log_audit_action('CALIBRATION_PROFILE_UPDATED', 'CalibrationProfile', profile.id, {
        'validation_status': profile.validation_status
    })

    return jsonify(profile.to_dict())
