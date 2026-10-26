from datetime import datetime, timezone
import json
from app.extensions import db

class CalibrationProfile(db.Model):
    __tablename__ = 'calibration_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    material_batch = db.Column(db.String(100), nullable=False)
    # reference_data holds a JSON array of reference points:
    # [{"ph": 4.0, "rgb": [215, 75, 110], "lab": [52.1, 58.4, 12.3], "hex": "#D74B6E", "notes": "acidic/pink"}, ...]
    reference_data_json = db.Column(db.Text, nullable=False, default='[]')
    # experiment_metadata holds metadata about light conditions, spectrophotometer model, extraction protocol, etc.
    experiment_metadata_json = db.Column(db.Text, nullable=False, default='{}')
    # VALIDATED, EXPERIMENTAL, UNVALIDATED
    validation_status = db.Column(db.String(30), nullable=False, default='EXPERIMENTAL')
    profile_version = db.Column(db.String(20), nullable=False, default='1.0')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    @property
    def reference_data(self):
        try:
            return json.loads(self.reference_data_json)
        except Exception:
            return []

    @reference_data.setter
    def reference_data(self, value):
        self.reference_data_json = json.dumps(value)

    @property
    def experiment_metadata(self):
        try:
            return json.loads(self.experiment_metadata_json)
        except Exception:
            return {}

    @experiment_metadata.setter
    def experiment_metadata(self, value):
        self.experiment_metadata_json = json.dumps(value)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'material_batch': self.material_batch,
            'reference_data': self.reference_data,
            'experiment_metadata': self.experiment_metadata,
            'validation_status': self.validation_status,
            'profile_version': self.profile_version,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
