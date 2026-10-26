import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Scan } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { QualityMeter } from '../components/common/QualityMeter';
import { ColorSwatch } from '../components/common/ColorSwatch';
import { Modal } from '../components/common/Modal';
import {
  ClipboardCheck,
  Filter,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  RefreshCw,
  Save,
  Check,
  Flag,
} from 'lucide-react';

export const ReviewQueuePage: React.FC = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  // Quick Review Modal State
  const [activeScan, setActiveScan] = useState<Scan | null>(null);
  const [modalAssessment, setModalAssessment] = useState('ROUTINE_FOLLOW_UP');
  const [modalNotes, setModalNotes] = useState('');
  const [modalReviewStatus, setModalReviewStatus] = useState<'REVIEWED' | 'FLAGGED'>('REVIEWED');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getScans({
        review_status: 'PENDING',
        requires_review: true,
        limit: 100,
      });
      setScans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenReview = (scan: Scan) => {
    setActiveScan(scan);
    setModalAssessment(scan.status_category === 'RED' ? 'CONCERN' : 'ROUTINE_FOLLOW_UP');
    setModalReviewStatus('REVIEWED');
    setModalNotes('');
  };

  const handleSaveModalReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScan) return;
    setIsSubmitting(true);
    try {
      await api.reviewScan(activeScan.id, {
        review_status: modalReviewStatus,
        assessment: modalAssessment,
        note: modalNotes.trim() || undefined,
      });
      setActiveScan(null);
      fetchQueue();
    } catch (err: any) {
      alert(`Error saving review: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredScans = scans.filter((s) => {
    if (filterPriority === 'RED') return s.status_category === 'RED';
    if (filterPriority === 'AMBER') return s.status_category === 'AMBER';
    if (filterPriority === 'QUALITY') return s.image_quality_status === 'INSUFFICIENT_QUALITY';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Clinician Review Queue</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {scans.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Priority triage for dressing scans triggering algorithmic range flags or quality warnings.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" /> Refresh Queue
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        <button
          onClick={() => setFilterPriority('ALL')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterPriority === 'ALL'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Pending ({scans.length})
        </button>

        <button
          onClick={() => setFilterPriority('RED')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterPriority === 'RED'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          Priority Review (Red)
        </button>

        <button
          onClick={() => setFilterPriority('AMBER')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterPriority === 'AMBER'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          Outside Range (Amber)
        </button>

        <button
          onClick={() => setFilterPriority('QUALITY')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterPriority === 'QUALITY'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Quality Warnings
        </button>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {filteredScans.length > 0 ? (
          filteredScans.map((scan) => (
            <div
              key={scan.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                  <img
                    src={api.getScanImageUrl(scan.id, true)}
                    alt="Bandage Thumb"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* Patient and Reason */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-900 text-sm">
                      {scan.patient_name || 'Patient'}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      ({scan.patient_reference}) • Scan #{scan.id}
                    </span>
                    <StatusBadge status={scan.status_category} size="sm" />
                  </div>

                  <p className="text-xs text-slate-700 font-medium">
                    {scan.interpretation}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {scan.created_at ? new Date(scan.created_at).toLocaleString() : ''}
                    </span>
                    <span>•</span>
                    <span>Wound: {scan.wound_location || 'General'}</span>
                  </div>
                </div>
              </div>

              {/* Metrics & Action Buttons */}
              <div className="flex flex-wrap items-center gap-5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <ColorSwatch hex={scan.hex_color} size="sm" />

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">pH Estimate</span>
                  <span className="font-bold text-navy-900 text-sm">
                    {scan.estimated_ph !== null && scan.estimated_ph !== undefined
                      ? `pH ${scan.estimated_ph.toFixed(1)}`
                      : 'Unavailable'}
                  </span>
                </div>

                <div className="w-24">
                  <QualityMeter score={scan.quality_score} status={scan.image_quality_status} />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenReview(scan)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Quick Triage
                  </button>

                  <Link
                    to={`/scans/${scan.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                    title="View Full Scan"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
            <ClipboardCheck className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-navy-900">Review Queue Empty</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All scans requiring priority clinician attention have been reviewed.
            </p>
          </div>
        )}
      </div>

      {/* Quick Triage Modal */}
      <Modal
        isOpen={!!activeScan}
        onClose={() => setActiveScan(null)}
        title={`Clinical Review: Scan #${activeScan?.id}`}
        subtitle={`Patient: ${activeScan?.patient_name} (${activeScan?.patient_reference})`}
      >
        {activeScan && (
          <form onSubmit={handleSaveModalReview} className="space-y-4 text-xs">
            {/* Quick overview swatch and interpretation */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg border border-slate-300 shadow-inner flex-shrink-0"
                style={{ backgroundColor: activeScan.hex_color }}
              />
              <div>
                <p className="font-semibold text-navy-900">
                  {activeScan.estimated_ph !== null && activeScan.estimated_ph !== undefined
                    ? `Estimated pH ${activeScan.estimated_ph.toFixed(1)}`
                    : 'Uncalibrated Color'} • {activeScan.hex_color}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">
                  {activeScan.interpretation}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Triage Action</label>
                <select
                  value={modalReviewStatus}
                  onChange={(e) => setModalReviewStatus(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="REVIEWED">Mark as Reviewed</option>
                  <option value="FLAGGED">Flag for Follow-up</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Assessment</label>
                <select
                  value={modalAssessment}
                  onChange={(e) => setModalAssessment(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ROUTINE_FOLLOW_UP">Routine Surveillance</option>
                  <option value="HEALING">Favorable Healing Progress</option>
                  <option value="STABLE">Stable Condition</option>
                  <option value="CONCERN">Exudate / pH Concern</option>
                  <option value="REPEAT_SCAN_REQUESTED">Request Repeat Scan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinician Note</label>
              <textarea
                rows={3}
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="Enter clinical assessment or follow-up recommendation..."
                className="w-full text-xs p-3 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveScan(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-navy-900 bg-white border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSubmitting ? 'Recording...' : 'Submit Triage'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
