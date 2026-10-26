# HealSense™ — Smart Wound Monitoring and Doctor Dashboard

[![Clinical Prototype](https://img.shields.io/badge/Status-Research%20Prototype-teal.svg)](#clinical-safety--regulatory-limitations)
[![Android APK](https://img.shields.io/badge/Android%20APK-Download%20Build-success.svg)](https://github.com/JOWINJNALPAT/healsense-bandage/actions/runs/40273529060)
[![Build Android APK](https://github.com/JOWINJNALPAT/healsense-bandage/actions/workflows/build-apk.yml/badge.svg)](https://github.com/JOWINJNALPAT/healsense-bandage/actions/workflows/build-apk.yml)
[![Backend](https://img.shields.io/badge/Backend-Flask%20%7C%20OpenCV%20%7C%20SQLAlchemy-navy.svg)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite-blue.svg)](frontend/)
[![Tests](https://img.shields.io/badge/Tests-11%20Passed%20(100%25)-emerald.svg)](backend/tests/)

> **HealSense™** is a full-stack, research-grade software platform for smart wound dressings utilizing natural anthocyanin indicator layers (such as purple sweet potato anthocyanin extracts). It captures dressing photographs, calculates representative sRGB, HSV, and CIELAB color values via OpenCV, evaluates image quality (blur, glare, contrast), matches configurable experimental calibration curves, and provides structured clinical decision support for wound care specialists.

---

## 1. Clinical Safety & Regulatory Limitations

> [!IMPORTANT]
> **HealSense™ is an investigational research prototype.**
> - **Color analysis and estimated pH do NOT diagnose or exclude wound infection.**
> - Optical values are influenced by camera optics, flash reflections, ambient scene spectra, and dressing hydration.
> - Normal physiological pH readings do not exclude biofilm or pathogenic bacterial colonization.
> - The system strictly enforces status qualifications: *"Within configured reference range"*, *"Outside configured reference range / Needs review"*, *"Priority clinical review"*, or *"Insufficient image quality / Calibration unavailable"*.
> - **The system strictly refuses to invent or fabricate pH readings when an unvalidated or experimental profile is active.**

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8 with ES2023 target
- **Styling**: Tailwind CSS 3.4 with custom medical design tokens (Deep Navy `#14263D`, Primary Teal `#0D9488`, Slate Background `#F5F8FA`)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Longitudinal trajectory line charts, status categorization donuts)
- **Routing**: React Router v7
- **Architecture**: Modular API service layer with JWT interceptors, AuthContext, accessible modals, and status badges.

### Backend
- **Framework**: Python 3.12 Flask REST API with Flask-CORS
- **Database & ORM**: SQLAlchemy with SQLite (local development) and PostgreSQL (production ready)
- **Computer Vision Pipeline**: OpenCV (`opencv-python-headless`), Pillow, and NumPy
- **Color Science**: CIE D65 sRGB-to-CIELAB converter and CIEDE2000 perceptual color difference ($\Delta E$)
- **Reporting**: ReportLab PDF generator and CSV batch exporter
- **Authentication**: JWT (JSON Web Tokens) with Role-Based Access Control (`doctor`, `staff`)
- **Testing**: pytest suite covering computer vision, color metrics, calibration gates, and REST endpoints.

---

## 3. Project Structure

```
BANDAGE/
├── backend/
│   ├── app/
│   │   ├── api/                 # REST endpoints (auth, dashboard, patients, scans, calibration, reports)
│   │   ├── auth/                # JWT token helpers, login_required, role_required decorators
│   │   ├── models/              # SQLAlchemy models (User, Patient, Scan, CalibrationProfile, ReviewNote, AuditLog)
│   │   ├── services/
│   │   │   ├── image_analysis.py # OpenCV pipeline, glare masking, blur detection, CIELAB D65 conversion
│   │   │   ├── calibration.py    # Anthocyanin calibration curves, CIEDE2000 matching, safety categorization
│   │   │   └── report_service.py # ReportLab medical PDF report generator & CSV exporter
│   │   ├── config.py            # Environment and database configuration
│   │   ├── extensions.py        # db, migrate, cors
│   │   └── seed.py              # Synthetic dressing image generator & clinical records seeder
│   ├── tests/                   # pytest unit & integration test suite (11 test cases)
│   ├── Dockerfile               # Production container definition
│   ├── requirements.txt         # Pinned backend dependencies
│   ├── pytest.ini               # Pytest path configuration
│   └── run.py                   # Development & production server entry point
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI (Navbar, Sidebar, StatusBadge, QualityMeter, ColorSwatch, StatCard, Modal)
│   │   ├── context/             # AuthContext with demo credentials & session persistence
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx   # Public homepage with anthocyanin spectrum visualizer & 3-step workflow
│   │   │   ├── LoginPage.tsx     # Sign-in page with 1-click Demo Doctor & Nurse buttons
│   │   │   ├── DashboardPage.tsx # Doctor dashboard with live KPIs, charts, and scan records
│   │   │   ├── PatientsPage.tsx  # Patient directory with registration modal & filters
│   │   │   ├── PatientDetailPage.tsx # Longitudinal history timeline & patient trend graph
│   │   │   ├── NewScanPage.tsx   # Optical scan interface (Camera/Upload, interactive ROI, guidelines)
│   │   │   ├── ScanDetailPage.tsx# Scan inspection (CIELAB, RGB, quality meters, review workflow, PDF export)
│   │   │   ├── ReviewQueuePage.tsx# Clinician triage queue with quick modal
│   │   │   ├── CalibrationPage.tsx# Anthocyanin calibration curves & validation state gates
│   │   │   └── ReportsPage.tsx   # Reports center (PDF & CSV exports)
│   │   ├── services/api.ts      # Typed API client
│   │   ├── types/index.ts       # Shared TypeScript interfaces
│   │   ├── App.tsx              # Application router
│   │   └── main.tsx             # Application mount
│   ├── Dockerfile               # Multi-stage production container
│   ├── nginx.conf               # SPA routing fallback configuration
│   ├── tailwind.config.js       # Design tokens & color palettes
│   └── package.json             # Frontend dependencies
├── docker-compose.yml           # Multi-container local orchestration (Postgres, Backend, Frontend)
├── .env.example                 # Environment variables template
└── README.md                    # System documentation
```

---

## 4. Quick Start (Local Development)

### Prerequisites
- Node.js v18+ and npm v9+
- Python 3.10+ (Python 3.12 recommended)

### Step 1: Clone and Set Up Backend
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and seed synthetic demo data
python -m app.seed

# Start the Flask API server (runs on http://127.0.0.1:5000)
python run.py
```

### Step 2: Set Up and Run Frontend
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install packages
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

Open **`http://localhost:5173/`** in your browser.

---

## 5. Demo Accounts

The application includes pre-seeded demonstration accounts with realistic synthetic clinical data and actual dressing images:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor@healsense.med` | `DoctorSecure2026!` | Full clinical review, patient records, triage queue, report generation |
| **Staff / Nurse** | `nurse@healsense.med` | `NurseSecure2026!` | Patient registration, dressing image capture, scan submission |

> **Tip**: On the `/login` page, you can click the **"Doctor Role"** or **"Nurse / Staff"** buttons for instant 1-click authentication!

---

## 6. Running Automated Tests

The test suite validates image processing, CIELAB D65 conversions, CIEDE2000 calculations, calibration validation gates, and REST API flows:

```bash
cd backend
.\venv\Scripts\pytest.exe
```

Expected output:
```
============================= test session starts =============================
tests/test_api.py ...                                                    [ 27%]
tests/test_calibration.py ...                                            [ 54%]
tests/test_image_analysis.py .....                                       [100%]
======================== 11 passed, 1 warning in 5.36s ========================
```

To run frontend production build validation:
```bash
cd frontend
npm run build
```

---

## 7. Running with Docker Compose

To run the complete production-grade stack (PostgreSQL database, Flask backend with Gunicorn, and React frontend served via Nginx):

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

---

## 8. Deployment Guide

### A. Deploying Frontend (Vercel / Netlify)
1. Push repository to GitHub/GitLab.
2. Link the repository to **Vercel** or **Netlify**.
3. Set root directory to `frontend`.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variable:
   - `VITE_API_BASE_URL`: URL of your deployed Flask backend (e.g. `https://healsense-api.onrender.com`).

### B. Deploying Backend (Render / Railway / Fly.io / AWS ECS)
1. Create a **PostgreSQL** database service on your hosting provider.
2. Deploy the backend using the provided `backend/Dockerfile` or native Python environment:
   - Build command: `pip install -r requirements.txt gunicorn`
   - Start command: `gunicorn --bind 0.0.0.0:$PORT run:app`
3. Configure Environment Variables:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `SECRET_KEY`: A secure 32+ character random secret string.
   - `FRONTEND_ORIGIN`: Your deployed frontend origin (e.g. `https://healsense.vercel.app`).
   - `DEMO_MODE`: `false` for production, `true` if you wish to pre-populate synthetic demonstration records.

---

## 9. Mobile App (Android APK)

The HealSense native Android application is powered by **Capacitor 8** with camera and storage permissions configured in `AndroidManifest.xml`.

### Automated Cloud Builds via GitHub Actions
Every push to `main` automatically builds a release-ready debug APK on Ubuntu runners with JDK 21 and the Android SDK.

- **Download APK**: Go to [GitHub Actions Workflow Runs](https://github.com/JOWINJNALPAT/healsense-bandage/actions/runs/40273529060).
- Scroll down to the **Artifacts** section at the bottom.
- Click **`HealSense-Android-App`** to download `HealSense-Android-App.zip`.
- Extract the zip file to obtain **`app-debug.apk`**.

### Installation on Android Device:
1. Transfer or download `app-debug.apk` to your Android smartphone or tablet.
2. Tap the APK file to install.
3. If prompted, enable *"Install unknown apps"* for your file manager or browser.
4. Launch **HealSense** from your home screen.
5. Login with demo credentials:
   - Doctor: `doctor@healsense.med` / `DoctorSecure2026!`
   - Nurse: `nurse@healsense.med` / `NurseSecure2026!`

---

## 10. API Reference Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check | No |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | No |
| `POST` | `/api/auth/demo-login` | Instant demo login for testing | No |
| `GET` | `/api/auth/me` | Current authenticated session | Yes |
| `GET` | `/api/dashboard/summary` | Live metrics & status counts | Yes |
| `GET` | `/api/dashboard/recent-scans` | Recent chronological scans | Yes |
| `GET` | `/api/dashboard/status-distribution` | Distribution chart data | Yes |
| `GET` | `/api/dashboard/patient-trend` | Patient longitudinal telemetry | Yes |
| `GET` | `/api/patients` | Filter & search patient directory | Yes |
| `POST` | `/api/patients` | Register new patient | Yes |
| `GET` | `/api/patients/:id` | Patient profile & metadata | Yes |
| `GET` | `/api/patients/:id/scans` | Scans for specific patient | Yes |
| `POST` | `/api/scans/analyze` | Optical image ingestion & CV engine | Yes |
| `GET` | `/api/scans/:id` | Scan analysis details & notes | Yes |
| `GET` | `/api/scans/:id/image` | Secure image / thumbnail stream | Yes |
| `POST` | `/api/scans/:id/review` | Clinician assessment & triage action | Yes |
| `GET` | `/api/calibration-profiles` | Configured anthocyanin profiles | Yes |
| `PATCH` | `/api/calibration-profiles/:id`| Update calibration validation state | Yes |
| `GET` | `/api/scans/:id/report` | Download formal ReportLab PDF report | Yes |
| `GET` | `/api/scans/export` | Export CSV dataset of measurements | Yes |

---

## 11. Final Acceptance Verification Checklist

- [x] Application starts locally using documented commands.
- [x] Landing page and responsive dashboard render with medical design system.
- [x] JWT authentication and protected routes function.
- [x] Doctor can register and view patients.
- [x] User can upload or capture a bandage image.
- [x] Region of Interest (ROI) can be selected or corrected manually.
- [x] Backend calculates actual image color values (RGB, HSV, CIELAB D65).
- [x] App refuses to invent a pH value when calibration is experimental/missing.
- [x] Calibrated color matching uses configured reference data & CIEDE2000.
- [x] Results include explicit uncertainty and safety disclaimers.
- [x] Scan is stored in persistent database and images are saved securely.
- [x] Dashboard statistics reflect saved records.
- [x] Doctor can review scans, assign assessments, and add clinical notes.
- [x] Longitudinal charts display actual saved measurements.
- [x] ReportLab printable PDF reports and CSV datasets can be generated.
- [x] API authorization blocks unauthenticated access.
- [x] 11 backend unit/integration tests pass (100%).
- [x] Frontend production build compiles without errors.
- [x] Dockerfile and Docker Compose configurations ready for deployment.
- [x] No production secrets or real patient records committed.
