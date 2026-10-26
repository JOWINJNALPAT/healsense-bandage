import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Scan } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ColorSwatch } from '../components/common/ColorSwatch';
import { QualityMeter } from '../components/common/QualityMeter';
import { AlertBanner } from '../components/common/AlertBanner';
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Sliders,
  Sparkles,
  Layers,
  MapPin,
  Calendar,
  Save,
  MessageSquare,
} from 'lucide-react';

export const ScanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clinician Review Box State
  const [reviewStatus, setReviewStatus] = useState<'REVIEWED' | 'FLAGGED'>('REVIEWED');
  const [assessment, setAssessment] = useState<string>('HEALING');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchScan = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getScan(Number(id));
      setScan(data);
      setReviewStatus(data.review_status === 'FLAGGED' ? 'FLAGGED' : 'REVIEWED');
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve scan record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scan) return;
    setIsSubmittingReview(true);
    try {
      const updated = await api.reviewScan(scan.id, {
        review_status: reviewStatus,
        assessment,
        note: reviewNote.trim() || undefined,
      });
      setScan(updated);
      setReviewNote('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
      fetchScan();
    } catch (err: any) {
      alert(`Review error: ${err.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!scan) return;
    try {
      const url = await api.getScanPdfReportUrl(scan.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HealSense_Scan_Report_${scan.patient_reference || 'Record'}_${scan.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Report download error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="lg:col-span-6 h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="space-y-4">
        <AlertBanner type="warning" title="Scan Record Error" message={error || 'Scan record not found.'} />
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-500 hover:text-navy-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">Dressing Scan #{scan.id}</h1>
              <StatusBadge status={scan.status_category} size="md" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient: <Link to={`/patients/${scan.patient_id}`} className="font-semibold text-teal-700 hover:underline">{scan.patient_name}</Link> ({scan.patient_reference}) • Scanned {scan.created_at ? new Date(scan.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Download PDF Report
          </button>

          <Link
            to={`/patients/${scan.patient_id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-navy-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all"
          >
            Patient Record
          </Link>
        </div>
      </div>

      {/* Safety Notice */}
      <AlertBanner
        type="safety"
        title="Research Prototype Clinical Notice"
        message="Color analysis and experimental pH estimates do not diagnose or exclude wound infection. Clinical assessment is required."
      />

      {/* Two Column Result Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Image Inspection & Swatch Visualizer */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-navy-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Smart Bandage Optical Scan</span>
              <span className="text-[11px] font-mono text-slate-400">
                Method: {scan.roi_coordinates?.detection_method || 'Automatic'}
              </span>
            </h2>

            {/* High-Res Image with Highlighted ROI Frame */}
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
              <img
                src={api.getScanImageUrl(scan.id)}
                alt="Original Bandage Scan"
                className="w-full h-full object-contain"
              />

              {/* Visual indicator of ROI position */}
              {scan.roi_coordinates && (
                <div
                  className="absolute border-2 border-teal-400 bg-teal-400/20 rounded shadow-md pointer-events-none"
                  style={{
                    left: `${(scan.roi_coordinates.x / (scan.roi_coordinates.x * 2.5 || 480)) * 100}%`,
                    top: `${(scan.roi_coordinates.y / (scan.roi_coordinates.y * 2.5 || 480)) * 100}%`,
                    width: '30%',
                    height: '30%',
                  }}
                >
                  <span className="absolute -top-5 left-0 bg-teal-600 text-white text-[9px] font-mono px-1 rounded">
                    Indicator ROI
                  </span>
                </div>
              )}
            </div>

            {/* Cropped Indicator Coupon Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden border border-slate-300 flex-shrink-0">
                  <img
                    src={api.getScanImageUrl(scan.id, true)}
                    alt="Cropped Indicator Patch"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-navy-900 block">Cropped Indicator Coupon</span>
                  <span className="text-[11px] text-slate-500">
                    Glare-masked representative pixels: {scan.quality_details?.valid_roi_pixels ?? '11,000+'} px
                  </span>
                </div>
              </div>

              <div
                className="w-8 h-8 rounded-full border border-slate-300 shadow-inner"
                style={{ backgroundColor: scan.hex_color }}
                title="Representative Median Color"
              />
            </div>
          </div>

          {/* Image Quality Score Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-navy-900">Image Quality Assessment</h3>
            <QualityMeter
              score={scan.quality_score}
              status={scan.image_quality_status}
              details={scan.quality_details}
              showDetails
            />
            {scan.quality_details?.warnings && scan.quality_details.warnings.length > 0 && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
                {scan.quality_details.warnings.map((w, idx) => (
                  <p key={idx} className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" /> {w}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Measurements, Calibrated Reference, Review Action */}
        <div className="lg:col-span-6 space-y-6">
          {/* Measured Colorimetric Values */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-navy-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Colorimetric Metrics & CIELAB</span>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Standard D65 Observer
              </span>
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Measured Color Swatch
                </span>
                <div className="mt-2">
                  <ColorSwatch
                    hex={scan.hex_color}
                    rgb={scan.median_rgb}
                    size="md"
                    showDetails
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Estimated Exudate pH
                </span>
                <div className="mt-1">
                  {scan.estimated_ph !== null && scan.estimated_ph !== undefined ? (
                    <p className="text-2xl font-extrabold text-navy-900">
                      pH {scan.estimated_ph.toFixed(1)}
                    </p>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-500">Unavailable</p>
                      <p className="text-[10px] text-slate-400 italic">Unvalidated profile</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed CIELAB Breakdown */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500 font-sans">sRGB Coordinates:</span>
                <span className="font-semibold">({scan.median_rgb[0]}, {scan.median_rgb[1]}, {scan.median_rgb[2]})</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500 font-sans">HSV Coordinates:</span>
                <span className="font-semibold">{scan.median_hsv[0]}°, {scan.median_hsv[1]}%, {scan.median_hsv[2]}%</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500 font-sans">CIELAB (L*, a*, b*):</span>
                <span className="font-semibold">[{scan.median_lab[0]}, {scan.median_lab[1]}, {scan.median_lab[2]}]</span>
              </div>
              {scan.color_distance !== null && scan.color_distance !== undefined && (
                <div className="flex justify-between text-teal-800 pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-sans">Perceptual Distance (ΔE*):</span>
                  <span className="font-bold">{scan.color_distance.toFixed(1)} (CIEDE2000)</span>
                </div>
              )}
            </div>

            {/* Calibration Profile Information */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-900">Calibration Profile:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  scan.calibration_status === 'VALIDATED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {scan.calibration_status}
                </span>
              </div>
              <p className="text-slate-600">{scan.calibration_profile_name || 'Standard Batch'}</p>
              {scan.nearest_reference_color && (
                <p className="text-[11px] text-slate-500 pt-1">
                  Closest Calibrated Coupon: <span className="font-semibold text-navy-900">{scan.nearest_reference_color.label} (pH {scan.nearest_reference_color.ph})</span>
                </p>
              )}
            </div>

            {/* Algorithmic Interpretation Text Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1 text-xs">
              <span className="font-bold text-navy-900 block text-xs">Algorithmic Interpretation:</span>
              <p className="text-slate-700 leading-relaxed">{scan.interpretation}</p>
            </div>
          </div>

          {/* Clinician Review & Structured Assessment Action Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-navy-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Clinician Review & Action</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Current: {scan.review_status}
              </span>
            </h2>

            {reviewSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Clinical review and note recorded successfully with audit timestamp.
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Review Status</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="REVIEWED">Mark as Reviewed</option>
                    <option value="FLAGGED">Flag for Priority Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Assessment</label>
                  <select
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="HEALING">Favorable Healing Progress</option>
                    <option value="STABLE">Stable Wound Condition</option>
                    <option value="CONCERN">Clinical Concern / Elevated Exudate</option>
                    <option value="REPEAT_SCAN_REQUESTED">Request Repeat Scan (Blur/Glare)</option>
                    <option value="ROUTINE_FOLLOW_UP">Routine Surveillance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Physician / Wound Specialist Clinical Notes
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="e.g. Granulation tissue robust. Indicator purple aligns with resolving wound bed. Continue daily hydrocolloid dressing change protocol."
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSubmittingReview ? 'Submitting Review...' : 'Save Clinical Assessment'}
              </button>
            </form>

            {/* Existing Clinical Notes History */}
            {scan.notes && scan.notes.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-600" /> Recorded Notes ({scan.notes.length}):
                </h4>
                {scan.notes.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-900">{n.clinician_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-navy-50 text-navy-800 border border-slate-200">
                      {n.assessment}
                    </span>
                    <p className="text-slate-600 italic">"{n.note}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
