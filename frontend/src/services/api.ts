import type {
  User,
  Patient,
  Scan,
  CalibrationProfile,
  DashboardSummary,
  ReviewNote,
  PatientTrendPoint,
} from '../types';
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
    return 'https://pink-areas-fix.loca.lt';
  }
  return '';
};
const API_BASE_URL = getApiBaseUrl();
class ApiService {
  private getHeaders(isFormData = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('healsense_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let errorMsg = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch {
        // Response wasn't json
      }
      if (res.status === 401) {
        localStorage.removeItem('healsense_token');
        localStorage.removeItem('healsense_user');
      }
      throw new Error(errorMsg);
    }
    return res.json() as Promise<T>;
  }

  // --- Auth ---
  async login(email: string, password: string):Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(res);
  }

  async demoLogin(role: 'doctor' | 'staff' = 'doctor'): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    return this.handleResponse(res);
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } finally {
      localStorage.removeItem('healsense_token');
      localStorage.removeItem('healsense_user');
    }
  }

  // --- Dashboard ---
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/summary`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getRecentScans(limit = 10): Promise<Scan[]> {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/recent-scans?limit=${limit}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getStatusDistribution(): Promise<{ name: string; key: string; value: number; color: string }[]> {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/status-distribution`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getPatientTrend(patientId?: number): Promise<{ patient_id: number; points: PatientTrendPoint[] }> {
    const query = patientId ? `?patient_id=${patientId}` : '';
    const res = await fetch(`${API_BASE_URL}/api/dashboard/patient-trend${query}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  // --- Patients ---
  async getPatients(params?: { search?: string; status?: string; page?: number; per_page?: number }): Promise<{
    patients: Patient[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
  }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());

    const res = await fetch(`${API_BASE_URL}/api/patients?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getPatient(id: number): Promise<Patient> {
    const res = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async createPatient(data: {
    name: string;
    patient_reference?: string;
    wound_location: string;
    wound_type?: string;
    date_of_birth?: string;
    contact_phone?: string;
  }): Promise<Patient> {
    const res = await fetch(`${API_BASE_URL}/api/patients`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  async updatePatient(id: number, data: Partial<Patient>): Promise<Patient> {
    const res = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  async getPatientScans(patientId: number): Promise<Scan[]> {
    const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/scans`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  // --- Scans ---
  async analyzeScan(formData: FormData): Promise<Scan> {
    const res = await fetch(`${API_BASE_URL}/api/scans/analyze`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    return this.handleResponse(res);
  }

  async getScans(params?: {
    patient_id?: number;
    review_status?: string;
    status_category?: string;
    requires_review?: boolean;
    limit?: number;
  }): Promise<Scan[]> {
    const query = new URLSearchParams();
    if (params?.patient_id) query.append('patient_id', params.patient_id.toString());
    if (params?.review_status) query.append('review_status', params.review_status);
    if (params?.status_category) query.append('status_category', params.status_category);
    if (params?.requires_review !== undefined) query.append('requires_review', params.requires_review.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE_URL}/api/scans?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getScan(id: number): Promise<Scan> {
    const res = await fetch(`${API_BASE_URL}/api/scans/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  getScanImageUrl(scanId: number, thumb = false): string {
    return `${API_BASE_URL}/api/scans/${scanId}/image?thumb=${thumb ? '1' : '0'}`;
  }

  async reviewScan(
    scanId: number,
    data: { review_status: 'REVIEWED' | 'FLAGGED'; assessment?: string; note?: string }
  ): Promise<Scan> {
    const res = await fetch(`${API_BASE_URL}/api/scans/${scanId}/review`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  async addScanNote(scanId: number, data: { note: string; assessment?: string }): Promise<ReviewNote> {
    const res = await fetch(`${API_BASE_URL}/api/scans/${scanId}/notes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  // --- Calibration Profiles ---
  async getCalibrationProfiles(): Promise<CalibrationProfile[]> {
    const res = await fetch(`${API_BASE_URL}/api/calibration-profiles`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getCalibrationProfile(id: number): Promise<CalibrationProfile> {
    const res = await fetch(`${API_BASE_URL}/api/calibration-profiles/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async createCalibrationProfile(data: Partial<CalibrationProfile>): Promise<CalibrationProfile> {
    const res = await fetch(`${API_BASE_URL}/api/calibration-profiles`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  async updateCalibrationProfile(id: number, data: Partial<CalibrationProfile>): Promise<CalibrationProfile> {
    const res = await fetch(`${API_BASE_URL}/api/calibration-profiles/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  // --- Reports & Exports ---
  async getScanPdfReportUrl(scanId: number): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/api/scans/${scanId}/report?format=pdf`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to generate PDF report');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  async downloadCsvExport(patientId?: number): Promise<void> {
    const query = patientId ? `?patient_id=${patientId}` : '';
    const res = await fetch(`${API_BASE_URL}/api/scans/export${query}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to export CSV');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healsense_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const api = new ApiService();
