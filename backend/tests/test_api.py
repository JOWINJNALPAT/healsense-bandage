import os
import json
import pytest
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.patient import Patient
from app.models.calibration import CalibrationProfile
from app.services.calibration import DEFAULT_ANTHOCYANIN_REFERENCE

TEST_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'test_run.db'))

@pytest.fixture
def app_instance():
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

    app = create_app()
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{TEST_DB_PATH}',
        'UPLOAD_FOLDER': os.path.abspath(os.path.join(os.path.dirname(__file__), 'temp_uploads')),
        'SECRET_KEY': 'test-secret-key-medical-prototype-32chars-min-healsense',
        'DEMO_MODE': False
    })

    with app.app_context():
        db.create_all()
        # Seed test user
        doc = User(name="Test Doctor", email="doc@test.com", role="doctor")
        doc.set_password("Secret123!")
        db.session.add(doc)

        cal = CalibrationProfile(
            name="Validated Test",
            material_batch="BATCH-T1",
            reference_data_json=json.dumps(DEFAULT_ANTHOCYANIN_REFERENCE),
            validation_status="VALIDATED"
        )
        db.session.add(cal)
        db.session.commit()

        yield app

        db.session.remove()
        db.drop_all()

    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

@pytest.fixture
def client(app_instance):
    return app_instance.test_client()

def test_login_success(client):
    res = client.post('/api/auth/login', json={
        'email': 'doc@test.com',
        'password': 'Secret123!'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert 'token' in data
    assert data['user']['email'] == 'doc@test.com'

def test_unauthorized_access(client):
    res = client.get('/api/patients')
    assert res.status_code == 401

def test_patient_crud_flow(client):
    # 1. Login
    login_res = client.post('/api/auth/login', json={
        'email': 'doc@test.com',
        'password': 'Secret123!'
    })
    token = login_res.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Create Patient
    create_res = client.post('/api/patients', headers=headers, json={
        'name': 'Alice Wong',
        'patient_reference': 'HS-TEST-01',
        'wound_location': 'Left heel',
        'wound_type': 'Diabetic Ulcer'
    })
    assert create_res.status_code == 201
    p_data = create_res.get_json()
    p_id = p_data['id']
    assert p_data['name'] == 'Alice Wong'

    # 3. List Patients
    list_res = client.get('/api/patients', headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.get_json()['patients']) == 1

    # 4. Get Patient by ID
    get_res = client.get(f'/api/patients/{p_id}', headers=headers)
    assert get_res.status_code == 200
    assert get_res.get_json()['patient_reference'] == 'HS-TEST-01'
