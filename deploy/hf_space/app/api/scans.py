import json
import os
from flask import Blueprint, request, jsonify, g, send_from_directory, current_app
from app.models.scan import Scan
from app.models.patient import Patient
from app.models.calibration import CalibrationProfile
from app.models.review_note import ReviewNote
from app.services.image_analysis import ImageAnalysisEngine
from app.services.calibration import CalibrationService
from app.auth.utils import login_required, log_audit_action
from app.extensions import db

scans_bp = Blueprint('scans', __name__, url_prefix='/api/scans')

@scans_bp.route('/analyze', methods=['POST'])
@login_required
def analyze_scan():
    # 1. Validate image upload
    if 'image' not in request.files:
        return jsonify({'error': 'No image file uploaded.'}), 400

    file = request.files['image']
    if not file or file.filename == '':
        return jsonify({'error': 'Empty image filename.'}), 400

    patient_id = request.form.get('patient_id')
    if not patient_id:
        return jsonify({'error': 'patient_id is required.'}), 400

    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'error': f"Patient with ID {patient_id} does not exist."}), 404

    # Optional ROI and Calibration Profile
    user_roi = None
    roi_raw = request.form.get('roi_coordinates')
    if roi_raw:
        try:
            user_roi = json.loads(roi_raw)
        except Exception:
            pass

    cal_profile_id = request.form.get('calibration_profile_id')
    profile = None
    if cal_profile_id:
        profile = CalibrationProfile.query.get(cal_profile_id)
    if not profile:
        # Default to first validated profile, or first active profile
        profile = CalibrationProfile.query.filter_by(validation_status='VALIDATED').first()
        if not profile:
            profile = CalibrationProfile.query.first()

    scan_notes = request.form.get('scan_notes', '').strip()

    # 2. Run Image Analysis Pipeline
    image_bytes = file.read()
    storage_dir = current_app.config['UPLOAD_FOLDER']

    try:
        cv_result = ImageAnalysisEngine.process_image(
            image_bytes=image_bytes,
            user_roi=user_roi,
            storage_dir=storage_dir
        )
    except Exception as e:
        return jsonify({'error': f"Image analysis failed: {str(e)}"}), 422

    # 3. Evaluate Color with Calibration Service
    cal_result = CalibrationService.evaluate_scan_color(
        median_lab=cv_result['median_lab'],
        median_rgb=cv_result['median_rgb'],
        profile=profile,
        quality_status=cv_result['image_quality_status']
    )

    # 4. Save Scan Record to Database
    scan = Scan(
        patient_id=patient.id,
        created_by=g.current_user.id,
        image_storage_key=cv_result['image_storage_key'],
        thumbnail_key=cv_result['thumbnail_key'],
        roi_coordinates_json=json.dumps(cv_result['roi_coordinates']),
        median_rgb_json=json.dumps(cv_result['median_rgb']),
        median_hsv_json=json.dumps(cv_result['median_hsv']),
        median_lab_json=json.dumps(cv_result['median_lab']),
        image_quality_status=cv_result['image_quality_status'],
        quality_score=cv_result['quality_score'],
        quality_details_json=json.dumps(cv_result['quality_details']),
        calibration_profile_id=profile.id if profile else None,
        calibration_status=cal_result['calibration_status'],
        nearest_reference_color_json=json.dumps(cal_result['nearest_reference_color']) if cal_result['nearest_reference_color'] else None,
        color_distance=cal_result['color_distance'],
        estimated_ph=cal_result['estimated_ph'],
        interpretation=cal_result['interpretation'],
        status_category=cal_result['status_category'],
        requires_review=cal_result['requires_review'],
        review_status='PENDING',
        scan_notes=scan_notes or None
    )

    db.session.add(scan)
    db.session.commit()

    log_audit_action('SCAN_ANALYZED', 'Scan', scan.id, {
        'patient_id': patient.id,
        'status_category': scan.status_category,
        'estimated_ph': scan.estimated_ph
    })

    return jsonify(scan.to_dict()), 201

@scans_bp.route('', methods=['GET'])
@login_required
def list_scans():
    patient_id = request.args.get('patient_id')
    review_status = request.args.get('review_status')
    status_category = request.args.get('status_category')
    requires_review = request.args.get('requires_review')
    limit = int(request.args.get('limit', 50))

    query = Scan.query

    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if review_status:
        query = query.filter_by(review_status=review_status)
    if status_category:
        query = query.filter_by(status_category=status_category)
    if requires_review is not None:
        is_req = requires_review.lower() in ('1', 'true', 'yes')
        query = query.filter_by(requires_review=is_req)

    scans = query.order_by(Scan.created_at.desc()).limit(limit).all()
    return jsonify([s.to_dict() for s in scans])

@scans_bp.route('/<int:scan_id>', methods=['GET'])
@login_required
def get_scan(scan_id):
    scan = Scan.query.get_or_404(scan_id)
    data = scan.to_dict()
    data['notes'] = [n.to_dict() for n in scan.review_notes.order_by(ReviewNote.created_at.desc()).all()]
    return jsonify(data)

@scans_bp.route('/<int:scan_id>/image', methods=['GET'])
@login_required
def get_scan_image(scan_id):
    scan = Scan.query.get_or_404(scan_id)
    thumb = request.args.get('thumb', '0') == '1'
    target_key = scan.thumbnail_key if (thumb and scan.thumbnail_key) else scan.image_storage_key

    storage_dir = current_app.config['UPLOAD_FOLDER']
    return send_from_directory(storage_dir, target_key)

@scans_bp.route('/<int:scan_id>/review', methods=['POST'])
@login_required
def review_scan(scan_id):
    scan = Scan.query.get_or_404(scan_id)
    data = request.get_json() or {}

    review_action = data.get('review_status', 'REVIEWED').upper()
    assessment = data.get('assessment', 'ROUTINE_FOLLOW_UP')
    note_text = data.get('note', '').strip()

    if review_action not in ('REVIEWED', 'FLAGGED', 'PENDING'):
        return jsonify({'error': "Invalid review status. Must be 'REVIEWED', 'FLAGGED', or 'PENDING'."}), 400

    scan.review_status = review_action
    scan.reviewed_by = g.current_user.id
    from datetime import datetime, timezone
    scan.reviewed_at = datetime.now(timezone.utc)

    # Optional clinical note addition
    if note_text:
        note = ReviewNote(
            scan_id=scan.id,
            clinician_id=g.current_user.id,
            note=note_text,
            assessment=assessment
        )
        db.session.add(note)

    db.session.commit()
    log_audit_action('CLINICAL_REVIEW_SUBMITTED', 'Scan', scan.id, {
        'review_status': review_action,
        'assessment': assessment
    })

    return jsonify(scan.to_dict())

@scans_bp.route('/<int:scan_id>/notes', methods=['POST'])
@login_required
def add_scan_note(scan_id):
    scan = Scan.query.get_or_404(scan_id)
    data = request.get_json() or {}
    note_text = data.get('note', '').strip()
    assessment = data.get('assessment', 'ROUTINE_FOLLOW_UP')

    if not note_text:
        return jsonify({'error': 'Note text is required.'}), 400

    note = ReviewNote(
        scan_id=scan.id,
        clinician_id=g.current_user.id,
        note=note_text,
        assessment=assessment
    )
    db.session.add(note)
    db.session.commit()

    log_audit_action('NOTE_ADDED', 'Scan', scan.id, {'assessment': assessment})
    return jsonify(note.to_dict()), 201
