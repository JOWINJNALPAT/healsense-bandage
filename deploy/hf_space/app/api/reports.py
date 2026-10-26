from flask import Blueprint, request, jsonify, send_file, Response
from app.models.scan import Scan
from app.models.patient import Patient
from app.models.review_note import ReviewNote
from app.services.report_service import ReportService
from app.auth.utils import login_required, log_audit_action

reports_bp = Blueprint('reports', __name__, url_prefix='/api')

@reports_bp.route('/scans/<int:scan_id>/report', methods=['GET'])
@login_required
def get_scan_report(scan_id):
    scan = Scan.query.get_or_404(scan_id)
    patient = Patient.query.get(scan.patient_id)
    notes = scan.review_notes.order_by(ReviewNote.created_at.desc()).all()

    req_format = request.args.get('format', 'json').lower()

    if req_format == 'pdf':
        pdf_stream = ReportService.generate_scan_pdf(scan, patient, notes)
        filename = f"HealSense_Scan_{scan.patient.patient_reference if scan.patient else 'Record'}_{scan.id}.pdf"
        log_audit_action('REPORT_EXPORTED_PDF', 'Scan', scan.id)
        return send_file(
            pdf_stream,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )

    # Return structured JSON report
    report_data = {
        'scan': scan.to_dict(),
        'patient': patient.to_dict(include_summary=False) if patient else None,
        'clinical_notes': [n.to_dict() for n in notes],
        'safety_notice': "HealSense is a research prototype. Color analysis and experimental pH estimates do not diagnose or exclude wound infection. Clinical assessment is required."
    }
    return jsonify(report_data)

@reports_bp.route('/patients/<int:patient_id>/report', methods=['GET'])
@login_required
def get_patient_report(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    scans = Scan.query.filter_by(patient_id=patient.id).order_by(Scan.created_at.desc()).all()
    
    return jsonify({
        'patient': patient.to_dict(),
        'total_scans': len(scans),
        'scans': [s.to_dict() for s in scans],
        'safety_notice': "HealSense is a research prototype. Color analysis and experimental pH estimates do not diagnose or exclude wound infection. Clinical assessment is required."
    })

@reports_bp.route('/scans/export', methods=['GET'])
@login_required
def export_scans_csv():
    patient_id = request.args.get('patient_id')
    query = Scan.query
    if patient_id:
        query = query.filter_by(patient_id=patient_id)

    scans = query.order_by(Scan.created_at.desc()).all()
    csv_data = ReportService.generate_scans_csv(scans)
    
    log_audit_action('SCANS_EXPORTED_CSV', 'Scan', None, {'total_exported': len(scans)})
    
    return Response(
        csv_data,
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=healsense_scan_export.csv'}
    )
