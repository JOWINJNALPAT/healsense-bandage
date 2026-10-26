# HealSense™ — Architecture & Implementation Plan

## 1. System Overview
**HealSense™** is a clinical research prototype for smart wound bandage monitoring using natural anthocyanin indicator layers (such as purple sweet potato anthocyanin). It extracts objective color metrics (RGB, HSV, CIELAB), evaluates image quality, compares against calibrated experimental reference profiles, and provides clinician decision support while rigorously avoiding unsubstantiated diagnostic claims.

```
+-----------------------------------------------------------------------------------+
|                               HealSense™ System                                   |
+-----------------------------------------------------------------------------------+
|  Frontend (React 18 + Vite + TypeScript + Tailwind CSS + Lucide + Recharts)       |
|    - Landing Page & Public Educational Explainer                                  |
|    - Auth (JWT Session, Role-Based Access: Doctor, Clinician/Staff)               |
|    - Doctor Dashboard (Real metrics, Distribution Charts, Trend Analysis)         |
|    - Patient Management (Records, Wound details, Scan History Timeline)           |
|    - Scan Capture & ROI Interface (Live Camera, File Upload, Interactive Canvas)  |
|    - Analysis Results View (Swatches, CIELAB, Delta E, Quality Score, Status)     |
|    - Clinician Review Queue & Audit Logging                                       |
|    - Calibration Management (Anthocyanin reference curves, validation flags)      |
|    - Printable Reports & CSV/PDF Export                                           |
+-----------------------------------------+-----------------------------------------+
                                          | REST API (JSON + Multipart)
                                          v
+-----------------------------------------------------------------------------------+
|  Backend (Flask + SQLAlchemy + OpenCV + NumPy + Pillow + ReportLab + PyJWT)       |
|    - /api/auth: Login, Demo Seed, Current User Session, RBAC                      |
|    - /api/dashboard: Real aggregated metrics & distribution                       |
|    - /api/patients: CRUD, Scan history, Trend series                              |
|    - /api/scans: Upload, OpenCV Computer Vision Pipeline, Quality Scoring,        |
|                  Delta E Color Distance, Calibrated pH Estimator, Review Action   |
|    - /api/calibration-profiles: Configurable reference tables & validation gates |
|    - /api/reports: Printable medical scan summary, PDF export, CSV bulk export    |
+-----------------------------------------+-----------------------------------------+
                                          |
                      +-------------------+-------------------+
                      |                                       |
                      v                                       v
         SQLite / PostgreSQL Storage               Local Encrypted Disk / S3
          (Patients, Scans, Notes,                  (Raw Bandage Images,
           Calibrations, Audit Logs)                 ROI Crops, Thumbnails)
```

## 2. Computer Vision & Color Science Engine
1. **Secure Ingestion & Validation**: Check MIME type, magic bytes, dimensions, and normalize orientation via EXIF tags.
2. **Image Quality Assessment**:
   - Specular Glare: Proportion of overexposed luminance pixels ($V > 0.95$ in HSV or $Y > 240$ in YUV).
   - Blur Detection: Laplacian operator variance ($\sigma^2 < 100 \implies$ blur warning).
   - Dynamic Range & Contrast: Luminance standard deviation.
   - Quality Index: Weighted composite score (0–100) mapped to `Optimal`, `Acceptable`, or `Insufficient Image Quality`.
3. **Region of Interest (ROI)**:
   - User-defined interactive coordinates or automated anthocyanin contour segmentation (color thresholding on high saturation indicator area).
   - Glare masking: Exclusion of saturated specular highlights from representative median color calculation.
4. **Color Conversion**:
   - Median valid pixel RGB (0–255).
   - HSV color space ($H \in [0, 360^\circ], S \in [0, 100\%], V \in [0, 100\%]$).
   - Standard CIELAB ($L^*, a^*, b^*$) converted via D65 standard illuminant.
5. **Experimental Calibration Engine**:
   - Reference color map: Array of calibrated $(L^*, a^*, b^*, \text{pH})$ pairs derived from laboratory anthocyanin buffers.
   - CIE Delta E ($\Delta E^*_{76}$ and $\Delta E_{00}$) color distance calculation.
   - Distance-weighted interpolation for continuous pH estimation when profile status is `VALIDATED`.
   - Strict refusal to estimate pH if profile is `EXPERIMENTAL`, `UNVALIDATED`, or absent, explicitly reporting: *"Color measured successfully — pH estimation unavailable because no validated calibration profile is configured."*
6. **Clinical Status Categorization**:
   - **Green**: Within configured physiological reference range (e.g., pH 5.5 - 6.5, with mandatory note: *Does not exclude infection*).
   - **Amber**: Outside configured reference range (e.g., alkaline exudate $> 7.0$ or deviation from baseline).
   - **Red**: Priority clinical review (rapid shift or clinician override).
   - **Gray**: Insufficient image quality or missing calibration.

## 3. Database Schema
- **Users**: `id, name, email, password_hash, role (doctor|staff), is_active, created_at`
- **Patients**: `id, patient_reference, name, date_of_birth, contact_phone, wound_location, wound_type, created_by, created_at, updated_at`
- **Scans**: `id, patient_id, created_by, image_storage_key, roi_coordinates, median_rgb, median_hsv, median_lab, estimated_ph, calibration_profile_id, calibration_status, image_quality_status, quality_score, color_distance, interpretation, requires_review, review_status, reviewed_by, reviewed_at, created_at`
- **CalibrationProfiles**: `id, name, material_batch, reference_data, experiment_metadata, validation_status, profile_version, created_by, created_at, updated_at`
- **ReviewNotes**: `id, scan_id, clinician_id, note, assessment, created_at`
- **AuditLogs**: `id, actor_id, action, entity_type, entity_id, change_metadata, timestamp`

## 4. Execution Phases
- [x] Phase 1: Architecture & Detailed Implementation Plan
- [ ] Phase 2: Python Backend Setup, Virtual Environment, OpenCV & NumPy Color Pipeline, Models, Seed Script & REST API
- [ ] Phase 3: Frontend Setup (Vite + React + Tailwind + UI components), Navigation, State & API Client
- [ ] Phase 4: Core Features (Landing Page, Camera/Upload Scanner with Interactive ROI, Result Inspection, Patient Management, Doctor Dashboard & Review Queue, Calibration Management)
- [ ] Phase 5: PDF / CSV Report Generation, Audit Trail, Safety Disclaimers
- [ ] Phase 6: Automated Backend and Frontend Testing, Build Verification, Docker & Deployment Setup
