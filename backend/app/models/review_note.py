from datetime import datetime, timezone
from app.extensions import db

class ReviewNote(db.Model):
    __tablename__ = 'review_notes'
    
    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey('scans.id'), nullable=False, index=True)
    clinician_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    note = db.Column(db.Text, nullable=False)
    # STABLE, HEALING, CONCERN, REPEAT_SCAN_REQUESTED, ROUTINE_FOLLOW_UP
    assessment = db.Column(db.String(50), nullable=False, default='ROUTINE_FOLLOW_UP')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    clinician = db.relationship('User', foreign_keys=[clinician_id])

    def to_dict(self):
        return {
            'id': self.id,
            'scan_id': self.scan_id,
            'clinician_id': self.clinician_id,
            'clinician_name': self.clinician.name if self.clinician else 'Unknown Clinician',
            'note': self.note,
            'assessment': self.assessment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
