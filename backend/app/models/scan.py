from datetime import datetime, timezone
import json
from app.extensions import db

class Scan(db.Model):
    __tablename__ = 'scans'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False, index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # File keys in private storage
    image_storage_key = db.Column(db.String(255), nullable=False)
    thumbnail_key = db.Column(db.String(255), nullable=True)
    
    # Color extraction and ROI
    roi_coordinates_json = db.Column(db.Text, nullable=False, default='{}')
    median_rgb_json = db.Column(db.String(50), nullable=False, default='[0,0,0]')
    median_hsv_json = db.Column(db.String(50), nullable=False, default='[0,0,0]')
    median_lab_json = db.Column(db.String(50), nullable=False, default='[0,0,0]')
    
    # Quality & Calibration
    image_quality_status = db.Column(db.String(30), nullable=False, default='ACCEPTABLE')
    quality_score = db.Column(db.Integer, nullable=False, default=85)
    quality_details_json = db.Column(db.Text, nullable=True, default='{}')
    
    calibration_profile_id = db.Column(db.Integer, db.ForeignKey('calibration_profiles.id'), nullable=True)
    calibration_status = db.Column(db.String(30), nullable=False, default='EXPERIMENTAL')
    nearest_reference_color_json = db.Column(db.String(100), nullable=True)
    color_distance = db.Column(db.Float, nullable=True)  # CIE Delta E
    estimated_ph = db.Column(db.Float, nullable=True)   # Nullable if uncalibrated
    
    # Interpretation & Clinical Categorization
    interpretation = db.Column(db.Text, nullable=False)
    status_category = db.Column(db.String(20), nullable=False, default='AMBER') # GREEN, AMBER, RED, GRAY
    requires_review = db.Column(db.Boolean, default=False)
    
    # Clinician Review
    review_status = db.Column(db.String(20), nullable=False, default='PENDING') # PENDING, REVIEWED, FLAGGED
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    
    scan_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Relationships
    calibration_profile = db.relationship('CalibrationProfile', backref='scans', lazy='joined')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by], backref='reviewed_scans')
    creator = db.relationship('User', foreign_keys=[created_by], backref='submitted_scans')
    review_notes = db.relationship('ReviewNote', backref='scan', lazy='dynamic', cascade='all, delete-orphan')

    @property
    def roi_coordinates(self):
        try:
            return json.loads(self.roi_coordinates_json)
        except Exception:
            return {}

    @property
    def median_rgb(self):
        try:
            return json.loads(self.median_rgb_json)
        except Exception:
            return [0, 0, 0]

    @property
    def median_hsv(self):
        try:
            return json.loads(self.median_hsv_json)
        except Exception:
            return [0, 0, 0]

    @property
    def median_lab(self):
        try:
            return json.loads(self.median_lab_json)
        except Exception:
            return [0, 0, 0]

    @property
    def quality_details(self):
        try:
            return json.loads(self.quality_details_json) if self.quality_details_json else {}
        except Exception:
            return {}

    @property
    def nearest_reference_color(self):
        try:
            return json.loads(self.nearest_reference_color_json) if self.nearest_reference_color_json else None
        except Exception:
            return None

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_reference': self.patient.patient_reference if self.patient else None,
            'patient_name': self.patient.name if self.patient else None,
            'wound_location': self.patient.wound_location if self.patient else None,
            'image_storage_key': self.image_storage_key,
            'thumbnail_key': self.thumbnail_key,
            'roi_coordinates': self.roi_coordinates,
            'median_rgb': self.median_rgb,
            'median_hsv': self.median_hsv,
            'median_lab': self.median_lab,
            'hex_color': f"#{self.median_rgb[0]:02X}{self.median_rgb[1]:02X}{self.median_rgb[2]:02X}" if len(self.median_rgb) == 3 else '#888888',
            'image_quality_status': self.image_quality_status,
            'quality_score': self.quality_score,
            'quality_details': self.quality_details,
            'calibration_profile_id': self.calibration_profile_id,
            'calibration_profile_name': self.calibration_profile.name if self.calibration_profile else None,
            'calibration_status': self.calibration_status,
            'nearest_reference_color': self.nearest_reference_color,
            'color_distance': round(self.color_distance, 2) if self.color_distance is not None else None,
            'estimated_ph': round(self.estimated_ph, 2) if self.estimated_ph is not None else None,
            'interpretation': self.interpretation,
            'status_category': self.status_category,
            'requires_review': self.requires_review,
            'review_status': self.review_status,
            'reviewed_by': self.reviewed_by,
            'reviewer_name': self.reviewer.name if self.reviewer else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'scan_notes': self.scan_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'notes_count': self.review_notes.count(),
        }
