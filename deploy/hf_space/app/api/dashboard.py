from flask import Blueprint, jsonify, request
from sqlalchemy import func
from app.models.patient import Patient
from app.models.scan import Scan
from app.auth.utils import login_required
from app.extensions import db

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/summary', methods=['GET'])
@login_required
def get_summary():
    total_patients = Patient.query.count()
    total_scans = Scan.query.count()
    scans_requiring_review = Scan.query.filter_by(review_status='PENDING', requires_review=True).count()
    insufficient_quality = Scan.query.filter_by(image_quality_status='INSUFFICIENT_QUALITY').count()
    
    # Status category counts
    status_counts = {
        'GREEN': Scan.query.filter_by(status_category='GREEN').count(),
        'AMBER': Scan.query.filter_by(status_category='AMBER').count(),
        'RED': Scan.query.filter_by(status_category='RED').count(),
        'GRAY': Scan.query.filter_by(status_category='GRAY').count(),
    }

    # Reviewed vs Pending
    review_status_counts = {
        'PENDING': Scan.query.filter_by(review_status='PENDING').count(),
        'REVIEWED': Scan.query.filter_by(review_status='REVIEWED').count(),
        'FLAGGED': Scan.query.filter_by(review_status='FLAGGED').count(),
    }

    return jsonify({
        'total_patients': total_patients,
        'total_scans': total_scans,
        'scans_requiring_review': scans_requiring_review,
        'insufficient_quality_scans': insufficient_quality,
        'status_distribution': status_counts,
        'review_distribution': review_status_counts
    })

@dashboard_bp.route('/recent-scans', methods=['GET'])
@login_required
def get_recent_scans():
    limit = int(request.args.get('limit', 10))
    scans = Scan.query.order_by(Scan.created_at.desc()).limit(limit).all()
    return jsonify([s.to_dict() for s in scans])

@dashboard_bp.route('/status-distribution', methods=['GET'])
@login_required
def get_status_distribution():
    distribution = [
        {'name': 'Within Reference (Green)', 'key': 'GREEN', 'value': Scan.query.filter_by(status_category='GREEN').count(), 'color': '#15803D'},
        {'name': 'Needs Review (Amber)', 'key': 'AMBER', 'value': Scan.query.filter_by(status_category='AMBER').count(), 'color': '#B45309'},
        {'name': 'Priority Review (Red)', 'key': 'RED', 'value': Scan.query.filter_by(status_category='RED').count(), 'color': '#B91C1C'},
        {'name': 'Insufficient Quality / Uncalibrated (Gray)', 'key': 'GRAY', 'value': Scan.query.filter_by(status_category='GRAY').count(), 'color': '#64748B'},
    ]
    return jsonify(distribution)

@dashboard_bp.route('/patient-trend', methods=['GET'])
@login_required
def get_patient_trend():
    patient_id = request.args.get('patient_id')
    if not patient_id:
        # Default to patient with most scans
        top_patient = db.session.query(Scan.patient_id, func.count(Scan.id).label('cnt')).group_by(Scan.patient_id).order_by(func.count(Scan.id).desc()).first()
        if top_patient:
            patient_id = top_patient[0]
            
    if not patient_id:
        return jsonify([])

    scans = Scan.query.filter_by(patient_id=patient_id).order_by(Scan.created_at.asc()).all()
    points = []
    for s in scans:
        points.append({
            'scan_id': s.id,
            'timestamp': s.created_at.strftime("%b %d, %H:%M") if s.created_at else '',
            'date': s.created_at.strftime("%Y-%m-%d") if s.created_at else '',
            'ph': s.estimated_ph,
            'quality_score': s.quality_score,
            'hex_color': f"#{s.median_rgb[0]:02X}{s.median_rgb[1]:02X}{s.median_rgb[2]:02X}" if len(s.median_rgb) == 3 else '#888',
            'status_category': s.status_category,
            'color_distance': s.color_distance
        })
    return jsonify({
        'patient_id': int(patient_id),
        'points': points
    })
