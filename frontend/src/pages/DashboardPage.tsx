import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardSummary, Scan, Patient } from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { QualityMeter } from '../components/common/QualityMeter';
import { ColorSwatch } from '../components/common/ColorSwatch';
import { AlertBanner } from '../components/common/AlertBanner';
import {
  Users,
  Camera,
  AlertTriangle,
  HelpCircle,
  Plus,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  PieChart as PieChartIcon,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [trendPoints, setTrendPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, distRes, scansRes, patRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getStatusDistribution(),
        api.getRecentScans(8),
        api.getPatients({ per_page: 50 }),
      ]);

      setSummary(sumRes);
      setDistribution(distRes);
      setRecentScans(scansRes);
      setPatients(patRes.patients);

      if (patRes.patients.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patRes.patients[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load clinical dashboard records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch trend when patient changes
  useEffect(() => {
    if (selectedPatientId) {
      api
        .getPatientTrend(selectedPatientId)
        .then((res) => setTrendPoints(res.points))
        .catch(() => setTrendPoints([]));
    }
  }, [selectedPatientId]);

  const handleExportCsv = async () => {
    try {
      await api.downloadCsvExport();
    } catch (e: any) {
      alert(`Export error: ${e.message}`);
    }
  };

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Clinical Monitoring Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time optical anthocyanin pH telemetry, scan queues, and longitudinal wound records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-xl text-slate-500 hover:text-navy-900 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>

          <Link
            to="/patients"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-navy-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4 text-teal-600" />
            Add Patient
          </Link>

          <Link
            to="/scan/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm shadow-teal-600/20 transition-all hover:shadow"
          >
            <Camera className="w-4 h-4" />
            Capture New Scan
          </Link>
        </div>
      </div>

      {error && (
        <AlertBanner type="warning" title="Connection Notice" message={error} />
      )}

      {/* Safety Notice Banner */}
      <AlertBanner
        type="safety"
        title="Research Prototype Clinical Notice"
        message="HealSense™ colorimetric readings and estimated pH values do not diagnose or rule out wound infections. All statuses must be clinically correlated by authorized medical personnel."
      />

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Patients"
          value={summary?.total_patients ?? 0}
          subtitle="Active wound care cohort"
          icon={Users}
          variant="teal"
          onClick={() => navigate('/patients')}
        />

        <StatCard
          title="Total Scans Logged"
          value={summary?.total_scans ?? 0}
          subtitle="Dressing scans stored"
          icon={Camera}
          variant="default"
          onClick={() => navigate('/scans')}
        />

        <StatCard
          title="Requires Clinician Review"
          value={summary?.scans_requiring_review ?? 0}
          subtitle="Pending priority triage"
          icon={AlertTriangle}
          variant="amber"
          onClick={() => navigate('/reviews')}
        />

        <StatCard
          title="Low Quality Scans"
          value={summary?.insufficient_quality_scans ?? 0}
          subtitle="Blur/glare flags"
          icon={HelpCircle}
          variant="rose"
          onClick={() => navigate('/reviews?quality=INSUFFICIENT_QUALITY')}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Longitudinal pH Trend Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Longitudinal pH & Color Trajectory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Target physiological healing band (pH 5.5 – 6.8 highlighted)
              </p>
            </div>

            {/* Patient Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Patient:</span>
              <select
                value={selectedPatientId || ''}
                onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                className="text-xs font-semibold text-navy-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patient_reference} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 h-64">
            {trendPoints.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis domain={[4.0, 9.0]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
                            <p className="font-bold text-navy-900">{data.date}</p>
                            <p className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-full border border-black/10"
                                style={{ backgroundColor: data.hex_color }}
                              />
                              <span className="font-semibold text-slate-700">Estimated pH: {data.ph ?? 'N/A'}</span>
                            </p>
                            <p className="text-slate-500">Quality: {data.quality_score}/100</p>
                            <StatusBadge status={data.status_category} size="sm" />
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Normal Healing Reference Range Bounds */}
                  <ReferenceLine y={6.8} stroke="#0D9488" strokeDasharray="4 4" label={{ value: 'Target Max 6.8', fill: '#0D9488', fontSize: 10 }} />
                  <ReferenceLine y={5.5} stroke="#0D9488" strokeDasharray="4 4" label={{ value: 'Target Min 5.5', fill: '#0D9488', fontSize: 10 }} />
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
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
                No calibrated scan measurements recorded yet for this patient.
              </div>
            )}
          </div>
        </div>

        {/* Scan Status Distribution Donut */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-teal-600" />
              Status Categorization
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Configured clinical range breakdown</p>
          </div>

          <div className="h-48 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {distribution.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-bold text-navy-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-navy-900">Recent Wound Dressing Scans</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chronological record of recent indicator analyses</p>
          </div>
          <Link
            to="/reviews"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            View Triage Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient / ID</th>
                <th className="py-3 px-4">Measured Color</th>
                <th className="py-3 px-4">Estimated pH</th>
                <th className="py-3 px-4">Quality</th>
                <th className="py-3 px-4">Status Category</th>
                <th className="py-3 px-4">Review State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentScans.length > 0 ? (
                recentScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy-900">{scan.patient_name || 'Patient'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {scan.patient_reference} • #{scan.id}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <ColorSwatch
                        hex={scan.hex_color}
                        rgb={scan.median_rgb}
                        size="sm"
                      />
                    </td>

                    <td className="py-3.5 px-4">
                      {scan.estimated_ph !== null && scan.estimated_ph !== undefined ? (
                        <span className="font-bold text-navy-900 text-sm">pH {scan.estimated_ph.toFixed(1)}</span>
                      ) : (
                        <span className="text-slate-400 italic">Uncalibrated</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 min-w-[140px]">
                      <QualityMeter
                        score={scan.quality_score}
                        status={scan.image_quality_status}
                      />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={scan.status_category} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          scan.review_status === 'REVIEWED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : scan.review_status === 'FLAGGED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {scan.review_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/scans/${scan.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No scans available in the system yet.
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
