import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Scan, Patient } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { AlertBanner } from '../components/common/AlertBanner';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [patRes, scansRes] = await Promise.all([
          api.getPatients({ per_page: 100 }),
          api.getScans({ limit: 100 }),
        ]);
        setPatients(patRes.patients);
        setScans(scansRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await api.downloadCsvExport(selectedPatientId ? Number(selectedPatientId) : undefined);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadScanPdf = async (scanId: number, ref?: string) => {
    try {
      const url = await api.getScanPdfReportUrl(scanId);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HealSense_Scan_Report_${ref || 'Record'}_${scanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`PDF generation error: ${err.message}`);
    }
  };

  const filteredScans = selectedPatientId
    ? scans.filter((s) => s.patient_id === Number(selectedPatientId))
    : scans;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Clinical Reports & Export Center</h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate formal PDF clinical summaries and export longitudinal colorimetric data for auditing and research.
        </p>
      </div>

      <AlertBanner
        type="safety"
        title="Privacy & Data Minimization"
        message="Exported PDFs and CSV datasets are restricted to authorized medical staff. Ensure files are stored in accordance with local healthcare data protection regulations."
      />

      {/* CSV Batch Export Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-600" />
            Bulk CSV Measurement Dataset Export
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exports raw RGB, HSV, CIELAB (L*, a*, b*), estimated pH, quality scores, and review statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg text-navy-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Cohort Patients</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.patient_reference} — {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm shadow-teal-600/20 transition-all hover:shadow disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating CSV...' : 'Download CSV'}
          </button>
        </div>
      </div>

      {/* Printable / Downloadable Scan Reports List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-navy-900">Individual Scan Clinical Summaries</h2>
            <p className="text-xs text-slate-500 mt-0.5">Formal printable PDF documents with color swatches and notes</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredScans.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Scan ID</th>
                <th className="py-3 px-4">Patient Reference</th>
                <th className="py-3 px-4">Scan Date</th>
                <th className="py-3 px-4">Measured Swatch</th>
                <th className="py-3 px-4">Estimated pH</th>
                <th className="py-3 px-4">Status Category</th>
                <th className="py-3 px-4 text-right">Download Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScans.length > 0 ? (
                filteredScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                      #{scan.id}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {scan.patient_name} ({scan.patient_reference})
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {scan.created_at ? new Date(scan.created_at).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: scan.hex_color }}
                        />
                        <span className="font-mono text-slate-700">{scan.hex_color}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-navy-900">
                      {scan.estimated_ph !== null && scan.estimated_ph !== undefined
                        ? `pH ${scan.estimated_ph.toFixed(1)}`
                        : 'Uncalibrated'}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={scan.status_category} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadScanPdf(scan.id, scan.patient_reference)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No scan records found matching selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
