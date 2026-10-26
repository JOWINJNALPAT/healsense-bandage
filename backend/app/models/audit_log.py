from datetime import datetime, timezone
import json
from app.extensions import db

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)  # e.g., 'SCAN_ANALYZED', 'CLINICAL_REVIEW_SUBMITTED', 'PATIENT_UPDATED'
    entity_type = db.Column(db.String(50), nullable=False)  # 'Scan', 'Patient', 'CalibrationProfile'
    entity_id = db.Column(db.Integer, nullable=True)
    change_metadata_json = db.Column(db.Text, nullable=True, default='{}')
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    actor = db.relationship('User', foreign_keys=[actor_id])

    @property
    def change_metadata(self):
        try:
            return json.loads(self.change_metadata_json) if self.change_metadata_json else {}
        except Exception:
            return {}

    @change_metadata.setter
    def change_metadata(self, val):
        self.change_metadata_json = json.dumps(val)

    def to_dict(self):
        return {
            'id': self.id,
            'actor_id': self.actor_id,
            'actor_name': self.actor.name if self.actor else 'System',
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'change_metadata': self.change_metadata,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
        }
