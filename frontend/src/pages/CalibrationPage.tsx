import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CalibrationProfile } from '../types';
import { ColorSwatch } from '../components/common/ColorSwatch';
import { AlertBanner } from '../components/common/AlertBanner';
import { Modal } from '../components/common/Modal';
import {
  Sliders,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit,
  ShieldCheck,
  FileCode,
  Layers,
  FlaskConical,
} from 'lucide-react';

export const CalibrationPage: React.FC = () => {
  const [profiles, setProfiles] = useState<CalibrationProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<CalibrationProfile | null>(null);

  // Edit / Validate Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<'VALIDATED' | 'EXPERIMENTAL' | 'UNVALIDATED'>('EXPERIMENTAL');
  const [editName, setEditName] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await api.getCalibrationProfiles();
      setProfiles(data);
      if (data.length > 0 && !selectedProfile) {
        setSelectedProfile(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleOpenEdit = (prof: CalibrationProfile) => {
    setSelectedProfile(prof);
    setEditName(prof.name);
    setEditBatch(prof.material_batch);
    setEditStatus(prof.validation_status);
    setEditNotes(prof.experiment_metadata?.status_note || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    setIsSaving(true);
    try {
      const updated = await api.updateCalibrationProfile(selectedProfile.id, {
        name: editName,
        material_batch: editBatch,
        validation_status: editStatus,
        experiment_metadata: {
          ...selectedProfile.experiment_metadata,
          status_note: editNotes,
        },
      });

      setIsEditModalOpen(false);
      setSelectedProfile(updated);
      fetchProfiles();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
          Anthocyanin Calibration Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Spectrophotometric reference curves, validation status gates, and laboratory experiment metadata.
        </p>
      </div>

      <AlertBanner
        type="safety"
        title="Calibration Safety Enforcement"
        message="A calibration profile must not be marked VALIDATED merely because it is saved. Quantitative pH calculation is strictly locked unless verified laboratory buffer data and spectrophotometer metadata are documented."
      />

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Profiles List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-navy-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Configured Profiles ({profiles.length})</span>
            </h2>

            <div className="space-y-2">
              {profiles.map((prof) => (
                <div
                  key={prof.id}
                  onClick={() => setSelectedProfile(prof)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedProfile?.id === prof.id
                      ? 'border-teal-500 bg-teal-50/40 shadow-xs ring-1 ring-teal-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-navy-900 text-xs truncate max-w-[180px]">
                      {prof.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        prof.validation_status === 'VALIDATED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {prof.validation_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">Batch: {prof.material_batch}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Points: {prof.reference_data?.length || 0} reference coupons
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Profile Reference Table & Metadata */}
        <div className="lg:col-span-8 space-y-6">
          {selectedProfile ? (
            <>
              {/* Profile Overview Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h2 className="text-base font-bold text-navy-900">{selectedProfile.name}</h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Batch Identifier: {selectedProfile.material_batch} • Version {selectedProfile.profile_version}
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(selectedProfile)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs self-start sm:self-auto"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Profile & Validation
                  </button>
                </div>

                {/* Validation Status Indicator */}
                <div className="p-3.5 rounded-xl border flex items-center gap-3 text-xs bg-slate-50 border-slate-200">
                  <div className={`p-2 rounded-lg ${
                    selectedProfile.validation_status === 'VALIDATED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedProfile.validation_status === 'VALIDATED' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-navy-900 text-xs">
                      Status: {selectedProfile.validation_status}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedProfile.validation_status === 'VALIDATED'
                        ? 'Permitted for continuous pH estimation using distance-weighted CIEDE2000 interpolation.'
                        : 'Unvalidated profile. Quantitative pH is locked to prevent unverified clinical diagnosis.'}
                    </p>
                  </div>
                </div>

                {/* Experiment Metadata */}
                {selectedProfile.experiment_metadata && (
                  <div className="text-xs space-y-1.5 pt-2">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                      Laboratory Protocol & Sensor Matrix:
                    </span>
                    <div className="grid sm:grid-cols-2 gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Spectrophotometer:</span>
                        <span className="font-semibold text-navy-900">
                          {selectedProfile.experiment_metadata.spectrophotometer || 'Standard Lab CM-700d'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Illuminant:</span>
                        <span className="font-semibold text-navy-900">
                          {selectedProfile.experiment_metadata.illuminant || 'CIE D65 / 10° Observer'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Buffer Series:</span>
                        <span className="font-semibold text-navy-900">
                          {selectedProfile.experiment_metadata.buffer_system || 'Britton-Robinson universal'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Substrate Matrix:</span>
                        <span className="font-semibold text-navy-900">
                          {selectedProfile.experiment_metadata.matrix_substrate || 'Hydrocolloid / Cellulose'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Calibrated Reference Points Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-navy-900">Reference Colorimetric Coupons</h3>
                    <p className="text-[11px] text-slate-500">
                      Standardized anthocyanin color coordinates across pH series
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Calibrated pH</th>
                        <th className="py-2.5 px-4">Color Swatch</th>
                        <th className="py-2.5 px-4">CIELAB (L*, a*, b*)</th>
                        <th className="py-2.5 px-4">sRGB</th>
                        <th className="py-2.5 px-4">Classification Label</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {selectedProfile.reference_data?.map((pt) => (
                        <tr key={pt.ph} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-navy-900 font-sans">
                            pH {pt.ph.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2 font-mono">
                              <span
                                className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                                style={{ backgroundColor: pt.hex }}
                              />
                              <span className="text-[11px] text-slate-600">{pt.hex}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-600">
                            [{pt.lab?.[0]}, {pt.lab?.[1]}, {pt.lab?.[2]}]
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-600">
                            ({pt.rgb?.[0]}, {pt.rgb?.[1]}, {pt.rgb?.[2]})
                          </td>
                          <td className="py-2.5 px-4 font-sans text-xs text-slate-700">
                            {pt.label || 'Reference coupon'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              Select a calibration profile to view reference data.
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Calibration Profile"
        subtitle="Manage validation state and batch metadata"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Profile Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Material Batch Code</label>
            <input
              type="text"
              required
              value={editBatch}
              onChange={(e) => setEditBatch(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Validation State Gate</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="VALIDATED">VALIDATED (Permits Continuous pH Estimation)</option>
              <option value="EXPERIMENTAL">EXPERIMENTAL (Colorimetry Only — pH Locked)</option>
              <option value="UNVALIDATED">UNVALIDATED (Draft Laboratory Profile)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Validation / Experiment Notes</label>
            <textarea
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="e.g. Cross-calibrated against Britton-Robinson buffer series at 25°C with Minolta CM-700d."
              className="w-full text-xs p-3 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-navy-900 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Updating...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
