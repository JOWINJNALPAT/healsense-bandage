import os
import json
import uuid
from datetime import datetime, timedelta, timezone
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from app.extensions import db
from app.models.user import User
from app.models.patient import Patient
from app.models.calibration import CalibrationProfile
from app.models.scan import Scan
from app.models.review_note import ReviewNote
from app.services.calibration import DEFAULT_ANTHOCYANIN_REFERENCE, CalibrationService
from app.services.image_analysis import rgb_to_cielab

def generate_synthetic_bandage_image(center_rgb, storage_dir, filename_prefix="seed"):
    """
    Generate a high-fidelity synthetic image of a smart wound dressing with an anthocyanin
    indicator patch on medical dressing substrate, with realistic texture and lighting.
    """
    os.makedirs(storage_dir, exist_ok=True)
    width, height = 480, 480
    
    # 1. Neutral clinical background
    img = Image.new("RGB", (width, height), (238, 242, 246))
    draw = ImageDraw.Draw(img)

    # 2. Wound dressing border (hydrocolloid / foam border)
    dressing_bbox = [50, 50, 430, 430]
    draw.rounded_rectangle(dressing_bbox, radius=24, fill=(255, 255, 255), outline=(218, 225, 233), width=2)

    # 3. Inner absorbent pad
    pad_bbox = [85, 85, 395, 395]
    draw.rounded_rectangle(pad_bbox, radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=1)

    # 4. Central anthocyanin pH indicator circular coupon
    indicator_bbox = [180, 180, 300, 300]
    draw.ellipse(indicator_bbox, fill=tuple(center_rgb), outline=(180, 190, 205), width=2)

    # 5. Calibration reference markers on the dressing corners (black/white/gray squares)
    draw.rectangle([70, 70, 90, 90], fill=(20, 20, 20))
    draw.rectangle([390, 70, 410, 90], fill=(240, 240, 240), outline=(180, 180, 180))
    draw.rectangle([70, 390, 90, 410], fill=(128, 128, 128))
    draw.rectangle([390, 390, 410, 410], fill=(60, 60, 60))

    # Add gentle noise for textile texture
    img_np = np.array(img, dtype=np.float32)
    noise = np.random.normal(0, 3.0, img_np.shape)
    img_np = np.clip(img_np + noise, 0, 255).astype(np.uint8)
    final_img = Image.fromarray(img_np)

    unique_id = uuid.uuid4().hex[:12]
    orig_key = f"{filename_prefix}_{unique_id}.jpg"
    thumb_key = f"thumb_{filename_prefix}_{unique_id}.jpg"
    
    orig_path = os.path.join(storage_dir, orig_key)
    thumb_path = os.path.join(storage_dir, thumb_key)
    
    final_img.save(orig_path, "JPEG", quality=90)
    
    # Save cropped thumbnail of indicator
    crop_img = final_img.crop((170, 170, 310, 310))
    crop_img.save(thumb_path, "JPEG", quality=92)
    
    roi_info = {"x": 180, "y": 180, "width": 120, "height": 120, "detection_method": "SYNTHETIC_KNOWN"}
    return orig_key, thumb_key, roi_info

def seed_database(app):
    with app.app_context():
        # Check if already seeded
        if User.query.filter_by(email='doctor@healsense.med').first():
            print("Database already seeded with demo data. Skipping.")
            return

        print("Seeding HealSense database with realistic clinical demo data...")
        storage_dir = app.config['UPLOAD_FOLDER']

        # 1. Create Users
        doctor = User(
            name="Dr. Evelyn Reed, MD",
            email="doctor@healsense.med",
            role="doctor",
            is_active=True
        )
        doctor.set_password("DoctorSecure2026!")

        nurse = User(
            name="Jordan Rivera, BSN, RN, CWOCN",
            email="nurse@healsense.med",
            role="staff",
            is_active=True
        )
        nurse.set_password("NurseSecure2026!")

        db.session.add_all([doctor, nurse])
        db.session.flush()

        # 2. Create Calibration Profiles
        profile_pspa = CalibrationProfile(
            name="Purple Sweet Potato Anthocyanin (PSPA) - Hydrocolloid Standard Batch",
            material_batch="PSPA-HC-2026-04A",
            reference_data_json=json.dumps(DEFAULT_ANTHOCYANIN_REFERENCE),
            experiment_metadata_json=json.dumps({
                "spectrophotometer": "Konica Minolta CM-700d",
                "illuminant": "CIE D65 Standard Daylight",
                "observer_angle": "10 degrees standard observer",
                "buffer_system": "Britton-Robinson universal buffer (pH 4.0 - 9.0 @ 25°C)",
                "pigment_source": "Ipomoea batatas acylated anthocyanin extract (purity 94.2%)",
                "matrix_substrate": "Porous carboxy-methyl cellulose hydrocolloid absorbent layer",
                "calibration_date": "2026-03-15",
                "lead_investigator": "Dr. E. Reed, Clinical Biomaterials Group"
            }),
            validation_status="VALIDATED",
            profile_version="1.2",
            created_by=doctor.id
        )

        profile_experimental = CalibrationProfile(
            name="Red Cabbage Anthocyanin (RCA) - Experimental Cellulose Strip",
            material_batch="RCA-EXP-B02",
            reference_data_json=json.dumps(DEFAULT_ANTHOCYANIN_REFERENCE),
            experiment_metadata_json=json.dumps({
                "spectrophotometer": "Laboratory Bench Spectrophotometer",
                "buffer_system": "Phosphate buffered saline",
                "status_note": "Awaiting multi-center clinical validation and optical cross-calibration."
            }),
            validation_status="EXPERIMENTAL",
            profile_version="0.9",
            created_by=doctor.id
        )

        db.session.add_all([profile_pspa, profile_experimental])
        db.session.flush()

        # 3. Create Patients
        patients_data = [
            {
                "patient_reference": "HS-1001",
                "name": "Robert Chen",
                "date_of_birth": "1960-04-12",
                "contact_phone": "+1 (555) 234-5678",
                "wound_location": "Right Plantar Hallux (Great Toe)",
                "wound_type": "Diabetic Foot Ulcer"
            },
            {
                "patient_reference": "HS-1002",
                "name": "Maria Santos",
                "date_of_birth": "1972-08-25",
                "contact_phone": "+1 (555) 345-6789",
                "wound_location": "Abdominal Midline Incision",
                "wound_type": "Post-Operative Surgical Wound"
            },
            {
                "patient_reference": "HS-1003",
                "name": "David Miller",
                "date_of_birth": "1953-11-03",
                "contact_phone": "+1 (555) 456-7890",
                "wound_location": "Left Medial Malleolus (Lower Leg)",
                "wound_type": "Venous Stasis Ulcer"
            },
            {
                "patient_reference": "HS-1004",
                "name": "Sarah Jenkins",
                "date_of_birth": "1988-02-19",
                "contact_phone": "+1 (555) 567-8901",
                "wound_location": "Right Dorsal Forearm",
                "wound_type": "Partial-Thickness Thermal Burn"
            }
        ]

        patients = []
        for p_info in patients_data:
            p = Patient(
                patient_reference=p_info["patient_reference"],
                name=p_info["name"],
                date_of_birth=p_info["date_of_birth"],
                contact_phone=p_info["contact_phone"],
                wound_location=p_info["wound_location"],
                wound_type=p_info["wound_type"],
                created_by=doctor.id
            )
            patients.append(p)
            db.session.add(p)

        db.session.flush()

        # 4. Generate Realistic Longitudinal Scans for Patients
        # Patient 1 (Robert Chen): Series of 4 scans showing healing trajectory from elevated pH ~7.6 to normal ~6.2
        now = datetime.now(timezone.utc)
        robert = patients[0]
        
        robert_scans = [
            {
                "days_ago": 14,
                "rgb": [68, 108, 172],  # Blue / alkaline pH ~7.6
                "notes": "Initial dressing application post-debridement. Moderate serous drainage."
            },
            {
                "days_ago": 9,
                "rgb": [95, 88, 170],  # Purple-blue pH ~7.1
                "notes": "Follow-up visit. Edema decreased. Indicator shows transition toward violet."
            },
            {
                "days_ago": 4,
                "rgb": [128, 76, 166], # Deep violet pH ~6.5
                "notes": "Granulation tissue healthy and beefy red. Edge epithelialization observed."
            },
            {
                "days_ago": 0,
                "rgb": [152, 72, 156], # Violet pH ~6.1
                "notes": "Dressing change routine. Target physiological healing pH maintained."
            }
        ]

        for s_idx, s_meta in enumerate(robert_scans):
            orig_k, thumb_k, roi = generate_synthetic_bandage_image(s_meta["rgb"], storage_dir, f"p1_s{s_idx}")
            lab = rgb_to_cielab(*s_meta["rgb"])
            
            cal_eval = CalibrationService.evaluate_scan_color(
                median_lab=list(lab),
                median_rgb=s_meta["rgb"],
                profile=profile_pspa,
                quality_status='OPTIMAL'
            )

            scan_time = now - timedelta(days=s_meta["days_ago"])
            is_recent = s_idx == len(robert_scans) - 1

            scan = Scan(
                patient_id=robert.id,
                created_by=nurse.id,
                image_storage_key=orig_k,
                thumbnail_key=thumb_k,
                roi_coordinates_json=json.dumps(roi),
                median_rgb_json=json.dumps(s_meta["rgb"]),
                median_hsv_json=json.dumps([275.0, 55.0, 65.0]),
                median_lab_json=json.dumps(list(lab)),
                image_quality_status='OPTIMAL',
                quality_score=94,
                quality_details_json=json.dumps({
                    'laplacian_blur_var': 142.5,
                    'contrast_std': 48.2,
                    'glare_percent': 0.8,
                    'valid_roi_pixels': 11300,
                    'warnings': []
                }),
                calibration_profile_id=profile_pspa.id,
                calibration_status=profile_pspa.validation_status,
                nearest_reference_color_json=json.dumps(cal_eval['nearest_reference_color']),
                color_distance=cal_eval['color_distance'],
                estimated_ph=cal_eval['estimated_ph'],
                interpretation=cal_eval['interpretation'],
                status_category=cal_eval['status_category'],
                requires_review=cal_eval['requires_review'],
                review_status='REVIEWED' if not is_recent else ('PENDING' if cal_eval['requires_review'] else 'REVIEWED'),
                reviewed_by=doctor.id if not is_recent else None,
                reviewed_at=scan_time + timedelta(hours=2) if not is_recent else None,
                scan_notes=s_meta["notes"],
                created_at=scan_time
            )
            db.session.add(scan)
            db.session.flush()

            # Add Clinician Review Note for older scans
            if not is_recent:
                note = ReviewNote(
                    scan_id=scan.id,
                    clinician_id=doctor.id,
                    note=f"Reviewed scan #{scan.id}. Color shift aligns with clinical presentation. Maintain non-adherent dressing protocol.",
                    assessment="HEALING" if scan.status_category == 'GREEN' else "STABLE",
                    created_at=scan_time + timedelta(hours=2)
                )
                db.session.add(note)

        # Patient 2 (Maria Santos): Surgical wound with sudden alkaline spike requiring review
        maria = patients[1]
        maria_scans = [
            {
                "days_ago": 6,
                "rgb": [132, 74, 164], # pH 6.4 (Green)
                "notes": "Post-discharge day 3 check. Wound dry and approximated."
            },
            {
                "days_ago": 1,
                "rgb": [48, 126, 154], # pH ~8.1 (Red - Priority Review)
                "notes": "Patient reported slight increase in wound exudate and perimeter warmth."
            }
        ]

        for s_idx, s_meta in enumerate(maria_scans):
            orig_k, thumb_k, roi = generate_synthetic_bandage_image(s_meta["rgb"], storage_dir, f"p2_s{s_idx}")
            lab = rgb_to_cielab(*s_meta["rgb"])
            
            cal_eval = CalibrationService.evaluate_scan_color(
                median_lab=list(lab),
                median_rgb=s_meta["rgb"],
                profile=profile_pspa,
                quality_status='OPTIMAL'
            )

            scan_time = now - timedelta(days=s_meta["days_ago"])
            scan = Scan(
                patient_id=maria.id,
                created_by=nurse.id,
                image_storage_key=orig_k,
                thumbnail_key=thumb_k,
                roi_coordinates_json=json.dumps(roi),
                median_rgb_json=json.dumps(s_meta["rgb"]),
                median_hsv_json=json.dumps([195.0, 68.0, 60.0]),
                median_lab_json=json.dumps(list(lab)),
                image_quality_status='OPTIMAL',
                quality_score=91,
                quality_details_json=json.dumps({
                    'laplacian_blur_var': 128.0,
                    'contrast_std': 42.1,
                    'glare_percent': 1.1,
                    'valid_roi_pixels': 11300,
                    'warnings': []
                }),
                calibration_profile_id=profile_pspa.id,
                calibration_status=profile_pspa.validation_status,
                nearest_reference_color_json=json.dumps(cal_eval['nearest_reference_color']),
                color_distance=cal_eval['color_distance'],
                estimated_ph=cal_eval['estimated_ph'],
                interpretation=cal_eval['interpretation'],
                status_category=cal_eval['status_category'],
                requires_review=True if cal_eval['status_category'] in ('RED', 'AMBER') else False,
                review_status='PENDING' if s_idx == 1 else 'REVIEWED',
                reviewed_by=doctor.id if s_idx == 0 else None,
                reviewed_at=scan_time + timedelta(hours=1) if s_idx == 0 else None,
                scan_notes=s_meta["notes"],
                created_at=scan_time
            )
            db.session.add(scan)

        # Patient 3 (David Miller): Venous Ulcer, scan with moderate image quality (Amber)
        david = patients[2]
        orig_k, thumb_k, roi = generate_synthetic_bandage_image([98, 86, 171], storage_dir, "p3_s0")
        lab = rgb_to_cielab(98, 86, 171)
        cal_eval = CalibrationService.evaluate_scan_color(
            median_lab=list(lab),
            median_rgb=[98, 86, 171],
            profile=profile_pspa,
            quality_status='ACCEPTABLE'
        )
        scan3 = Scan(
            patient_id=david.id,
            created_by=nurse.id,
            image_storage_key=orig_k,
            thumbnail_key=thumb_k,
            roi_coordinates_json=json.dumps(roi),
            median_rgb_json=json.dumps([98, 86, 171]),
            median_hsv_json=json.dumps([250.0, 50.0, 67.0]),
            median_lab_json=json.dumps(list(lab)),
            image_quality_status='ACCEPTABLE',
            quality_score=68,
            quality_details_json=json.dumps({
                'laplacian_blur_var': 75.0,
                'contrast_std': 31.0,
                'glare_percent': 4.5,
                'valid_roi_pixels': 11300,
                'warnings': ['Moderate scene blur detected']
            }),
            calibration_profile_id=profile_pspa.id,
            calibration_status=profile_pspa.validation_status,
            nearest_reference_color_json=json.dumps(cal_eval['nearest_reference_color']),
            color_distance=cal_eval['color_distance'],
            estimated_ph=cal_eval['estimated_ph'],
            interpretation=cal_eval['interpretation'],
            status_category='AMBER',
            requires_review=True,
            review_status='PENDING',
            scan_notes="Weekly compression dressing change.",
            created_at=now - timedelta(days=2)
        )
        db.session.add(scan3)

        # Patient 4 (Sarah Jenkins): Burn wound scan using unvalidated experimental profile (Gray status)
        sarah = patients[3]
        orig_k, thumb_k, roi = generate_synthetic_bandage_image([192, 66, 128], storage_dir, "p4_s0")
        lab = rgb_to_cielab(192, 66, 128)
        cal_eval = CalibrationService.evaluate_scan_color(
            median_lab=list(lab),
            median_rgb=[192, 66, 128],
            profile=profile_experimental, # Experimental profile -> Gray status!
            quality_status='OPTIMAL'
        )
        scan4 = Scan(
            patient_id=sarah.id,
            created_by=doctor.id,
            image_storage_key=orig_k,
            thumbnail_key=thumb_k,
            roi_coordinates_json=json.dumps(roi),
            median_rgb_json=json.dumps([192, 66, 128]),
            median_hsv_json=json.dumps([330.0, 65.0, 75.0]),
            median_lab_json=json.dumps(list(lab)),
            image_quality_status='OPTIMAL',
            quality_score=92,
            quality_details_json=json.dumps({
                'laplacian_blur_var': 135.0,
                'contrast_std': 45.0,
                'glare_percent': 1.0,
                'valid_roi_pixels': 11300,
                'warnings': []
            }),
            calibration_profile_id=profile_experimental.id,
            calibration_status=profile_experimental.validation_status,
            nearest_reference_color_json=None,
            color_distance=None,
            estimated_ph=None,  # Refuses to fabricate pH for experimental profile!
            interpretation=cal_eval['interpretation'],
            status_category='GRAY',
            requires_review=True,
            review_status='PENDING',
            scan_notes="Research protocol evaluation with experimental anthocyanin sensor matrix.",
            created_at=now - timedelta(days=1)
        )
        db.session.add(scan4)

        db.session.commit()
        print("Database successfully seeded with realistic clinical data and synthetic dressing images!")

if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        db.create_all()
        seed_database(app)
