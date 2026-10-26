from flask import Blueprint, request, jsonify, g
from app.models.patient import Patient
from app.models.scan import Scan
from app.auth.utils import login_required, log_audit_action
from app.extensions import db

patients_bp = Blueprint('patients', __name__, url_prefix='/api/patients')

@patients_bp.route('', methods=['GET'])
@login_required
def list_patients():
    search = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '').strip()
    wound_type_filter = request.args.get('wound_type', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    query = Patient.query

    if search:
        query = query.filter(
            (Patient.name.ilike(f'%{search}%')) |
            (Patient.patient_reference.ilike(f'%{search}%')) |
            (Patient.wound_location.ilike(f'%{search}%'))
        )

    if wound_type_filter:
        query = query.filter(Patient.wound_type == wound_type_filter)

    query = query.order_by(Patient.updated_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    patients_list = []
    for p in pagination.items:
        p_dict = p.to_dict()
        if status_filter and p_dict.get('latest_status') != status_filter:
            continue
        patients_list.append(p_dict)

    return jsonify({
        'patients': patients_list,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    })

@patients_bp.route('', methods=['POST'])
@login_required
def create_patient():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    patient_ref = data.get('patient_reference', '').strip()
    wound_location = data.get('wound_location', '').strip()

    if not name or not wound_location:
        return jsonify({'error': 'Patient name and wound location are required.'}), 400

    # Auto-generate reference ID if not provided
    if not patient_ref:
        count = Patient.query.count() + 1
        patient_ref = f"HS-{count:04d}"

    # Check uniqueness
    if Patient.query.filter_by(patient_reference=patient_ref).first():
        return jsonify({'error': f"Patient reference ID '{patient_ref}' is already in use."}), 409

    patient = Patient(
        patient_reference=patient_ref,
        name=name,
        date_of_birth=data.get('date_of_birth', '').strip() or None,
        contact_phone=data.get('contact_phone', '').strip() or None,
        wound_location=wound_location,
        wound_type=data.get('wound_type', 'General Wound').strip(),
        created_by=g.current_user.id
    )

    db.session.add(patient)
    db.session.commit()

    log_audit_action('PATIENT_CREATED', 'Patient', patient.id, {'reference': patient.patient_reference})

    return jsonify(patient.to_dict()), 201

@patients_bp.route('/<int:patient_id>', methods=['GET'])
@login_required
def get_patient(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    return jsonify(patient.to_dict())

@patients_bp.route('/<int:patient_id>', methods=['PATCH'])
@login_required
def update_patient(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        patient.name = data['name'].strip()
    if 'wound_location' in data and data['wound_location'].strip():
        patient.wound_location = data['wound_location'].strip()
    if 'wound_type' in data:
        patient.wound_type = data['wound_type'].strip()
    if 'contact_phone' in data:
        patient.contact_phone = data['contact_phone'].strip()
    if 'date_of_birth' in data:
        patient.date_of_birth = data['date_of_birth'].strip()

    db.session.commit()
    log_audit_action('PATIENT_UPDATED', 'Patient', patient.id)
    return jsonify(patient.to_dict())

@patients_bp.route('/<int:patient_id>/scans', methods=['GET'])
@login_required
def get_patient_scans(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    scans = Scan.query.filter_by(patient_id=patient.id).order_by(Scan.created_at.desc()).all()
    return jsonify([s.to_dict() for s in scans])
