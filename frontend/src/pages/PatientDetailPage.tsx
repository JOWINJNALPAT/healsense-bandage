import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Patient, Scan } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ColorSwatch } from '../components/common/ColorSwatch';
import { QualityMeter } from '../components/common/QualityMeter';
import { AlertBanner } from '../components/common/AlertBanner';
import {
  ArrowLeft,
  Camera,
  Calendar,
  MapPin,
  Bandage,
  FileText,
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from 'recharts';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPatientData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [patData, scansData] = await Promise.all([
          api.getPatient(Number(id)),
          api.getPatientScans(Number(id)),
        ]);
        setPatient(patData);
        setScans(scansData);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve patient medical profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
        <div className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <div className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <AlertBanner type="warning" title="Patient Record Error" message={error || 'Patient not found.'} />
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>
      </div>
    );
  }

  // Prepare chronological trend data (ascending order for graph)
  const chartPoints = [...scans]
    .reverse()
    .filter((s) => s.estimated_ph !== null && s.estimated_ph !== undefined)
    .map((s) => ({
      id: s.id,
      date: s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
      ph: s.estimated_ph,
      hex: s.hex_color,
      quality: s.quality_score,
      status: s.status_category,
    }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/patients"
            className="p-2 rounded-xl text-slate-500 hover:text-navy-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-navy-50 text-navy-800 border border-slate-200">
                {patient.patient_reference}
              </span>
              <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">{patient.name}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Smart Bandage Clinical Surveillance Profile</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => api.downloadCsvExport(patient.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            Export Patient Data
          </button>

          <Link
            to={`/scan/new?patient_id=${patient.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm shadow-teal-600/20 transition-all hover:shadow"
          >
            <Camera className="w-4 h-4" />
            Capture Scan
          </Link>
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Wound Location</span>
          <p className="text-sm font-bold text-navy-900 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
            {patient.wound_location}
          </p>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Etiology & Type</span>
          <p className="text-sm font-bold text-navy-900 mt-1 flex items-center gap-1.5">
            <Bandage className="w-4 h-4 text-teal-600 flex-shrink-0" />
            {patient.wound_type || 'Unspecified'}
          </p>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Date of Birth / Phone</span>
          <p className="text-xs font-semibold text-slate-700 mt-1">
            {patient.date_of_birth ? `DOB: ${patient.date_of_birth}` : 'DOB not recorded'}
          </p>
          {patient.contact_phone && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3" /> {patient.contact_phone}
            </p>
          )}
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Monitoring Status</span>
          <div className="mt-1">
            <StatusBadge status={patient.latest_status || 'NO_SCANS'} size="md" />
          </div>
        </div>
      </div>

      {/* Longitudinal Graph (If measurements exist) */}
      {chartPoints.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Longitudinal pH Trajectory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calibrated exudate pH across sequential dressing changes
              </p>
            </div>
          </div>

          <div className="pt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis domain={[4.0, 9.0]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                <RechartsTooltip />
                <ReferenceLine y={6.8} stroke="#0D9488" strokeDasharray="3 3" label={{ value: 'Target 6.8', fill: '#0D9488', fontSize: 10 }} />
                <ReferenceLine y={5.5} stroke="#0D9488" strokeDasharray="3 3" label={{ value: 'Target 5.5', fill: '#0D9488', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="ph"
                  stroke="#14263D"
                  strokeWidth={2.5}
                  dot={{ fill: '#0D9488', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chronological Scan History Timeline / Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-navy-900">Chronological Dressing Scan History ({scans.length})</h2>

        {scans.length > 0 ? (
          <div className="space-y-3">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 relative">
                    <img
                      src={api.getScanImageUrl(scan.id, true)}
                      alt="Dressing Scan"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Scan Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-900 text-sm">Scan #{scan.id}</span>
                      <StatusBadge status={scan.status_category} size="sm" />
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {scan.created_at ? new Date(scan.created_at).toLocaleString() : 'N/A'}
                      </span>
                      <span>•</span>
                      <span>Profile: {scan.calibration_profile_name || 'Standard Batch'}</span>
                    </div>

                    {scan.scan_notes && (
                      <p className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        "{scan.scan_notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Color & Metrics */}
                <div className="flex flex-wrap items-center gap-6">
                  <ColorSwatch
                    hex={scan.hex_color}
                    rgb={scan.median_rgb}
                    lab={scan.median_lab}
                    size="md"
                    showDetails
                  />

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Exudate pH</span>
                    {scan.estimated_ph !== null && scan.estimated_ph !== undefined ? (
                      <span className="text-base font-extrabold text-navy-900">pH {scan.estimated_ph.toFixed(1)}</span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Uncalibrated</span>
                    )}
                  </div>

                  <div className="w-28">
                    <QualityMeter score={scan.quality_score} status={scan.image_quality_status} />
                  </div>

                  <Link
                    to={`/scans/${scan.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl border border-teal-200 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> Full Report
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
            <Camera className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-navy-900">No scans recorded yet for this patient</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Capture or upload an image of the patient's anthocyanin smart dressing to begin telemetry.
            </p>
            <Link
              to={`/scan/new?patient_id=${patient.id}`}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
            >
              <Camera className="w-4 h-4" /> Capture First Scan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
