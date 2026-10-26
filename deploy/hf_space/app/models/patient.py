from datetime import datetime, timezone
from app.extensions import db

class Patient(db.Model):
    __tablename__ = 'patients'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_reference = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    date_of_birth = db.Column(db.String(20), nullable=True)
    contact_phone = db.Column(db.String(50), nullable=True)
    wound_location = db.Column(db.String(150), nullable=False)
    wound_type = db.Column(db.String(100), nullable=True)  # e.g., 'Diabetic Foot Ulcer', 'Post-Op Surgical', 'Venous Stasis'
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationship to scans
    scans = db.relationship('Scan', backref='patient', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_summary=True):
        data = {
            'id': self.id,
            'patient_reference': self.patient_reference,
            'name': self.name,
            'date_of_birth': self.date_of_birth,
            'contact_phone': self.contact_phone,
            'wound_location': self.wound_location,
            'wound_type': self.wound_type,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_summary:
            latest_scan = self.scans.order_by(db.desc(db.text('scans.created_at'))).first()
            data['total_scans'] = self.scans.count()
            data['latest_scan_date'] = latest_scan.created_at.isoformat() if latest_scan and latest_scan.created_at else None
            data['latest_status'] = latest_scan.status_category if latest_scan else 'NO_SCANS'
            data['latest_ph'] = latest_scan.estimated_ph if latest_scan else None
            data['requires_review'] = any(s.requires_review for s in self.scans.filter_by(review_status='PENDING').all())
        return data
