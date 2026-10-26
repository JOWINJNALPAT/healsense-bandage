export type UserRole = 'doctor' | 'staff';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Patient {
  id: number;
  patient_reference: string;
  name: string;
  date_of_birth?: string | null;
  contact_phone?: string | null;
  wound_location: string;
  wound_type?: string | null;
  created_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  total_scans?: number;
  latest_scan_date?: string | null;
  latest_status?: 'GREEN' | 'AMBER' | 'RED' | 'GRAY' | 'NO_SCANS';
  latest_ph?: number | null;
  requires_review?: boolean;
}

export type StatusCategory = 'GREEN' | 'AMBER' | 'RED' | 'GRAY';
export type QualityStatus = 'OPTIMAL' | 'ACCEPTABLE' | 'INSUFFICIENT_QUALITY';
export type ReviewStatus = 'PENDING' | 'REVIEWED' | 'FLAGGED';

export interface RoiCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  detection_method?: string;
}

export interface QualityDetails {
  laplacian_blur_var?: number;
  contrast_std?: number;
  glare_percent?: number;
  valid_roi_pixels?: number;
  warnings?: string[];
}

export interface ReferenceColorPoint {
  ph: number;
  rgb: [number, number, number];
  lab: [number, number, number];
  hex: string;
  label?: string;
  description?: string;
}

export interface CalibrationProfile {
  id: number;
  name: string;
  material_batch: string;
  reference_data: ReferenceColorPoint[];
  experiment_metadata: Record<string, any>;
  validation_status: 'VALIDATED' | 'EXPERIMENTAL' | 'UNVALIDATED';
  profile_version: string;
  created_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReviewNote {
  id: number;
  scan_id: number;
  clinician_id: number;
  clinician_name: string;
  note: string;
  assessment: string;
  created_at: string;
}

export interface Scan {
  id: number;
  patient_id: number;
  patient_reference?: string;
  patient_name?: string;
  wound_location?: string;
  image_storage_key: string;
  thumbnail_key?: string;
  roi_coordinates: RoiCoordinates;
  median_rgb: [number, number, number];
  median_hsv: [number, number, number];
  median_lab: [number, number, number];
  hex_color: string;
  image_quality_status: QualityStatus;
  quality_score: number;
  quality_details: QualityDetails;
  calibration_profile_id?: number | null;
  calibration_profile_name?: string | null;
  calibration_status: string;
  nearest_reference_color?: ReferenceColorPoint | null;
  color_distance?: number | null;
  estimated_ph?: number | null;
  interpretation: string;
  status_category: StatusCategory;
  requires_review: boolean;
  review_status: ReviewStatus;
  reviewed_by?: number | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  scan_notes?: string | null;
  created_at: string;
  notes_count?: number;
  notes?: ReviewNote[];
}

export interface DashboardSummary {
  total_patients: number;
  total_scans: number;
  scans_requiring_review: number;
  insufficient_quality_scans: number;
  status_distribution: {
    GREEN: number;
    AMBER: number;
    RED: number;
    GRAY: number;
  };
  review_distribution: {
    PENDING: number;
    REVIEWED: number;
    FLAGGED: number;
  };
}

export interface PatientTrendPoint {
  scan_id: number;
  timestamp: string;
  date: string;
  ph: number | null;
  quality_score: number;
  hex_color: string;
  status_category: StatusCategory;
  color_distance?: number | null;
}
