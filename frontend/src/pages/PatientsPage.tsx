import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Patient } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Search,
  Plus,
  Camera,
  ArrowRight,
  Filter,
  RefreshCw,
  Calendar,
  Phone,
  MapPin,
  Bandage,
} from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [woundTypeFilter, setWoundTypeFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Patient Form State
  const [newName, setNewName] = useState('');
  const [newRef, setNewRef] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newWoundType, setNewWoundType] = useState('Diabetic Foot Ulcer');
  const [newDob, setNewDob] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.getPatients({
        search,
        status: statusFilter,
        per_page: 50,
      });
      setPatients(res.patients);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, statusFilter]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newName.trim() || !newLocation.trim()) {
      setFormError('Patient name and wound location are mandatory.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createPatient({
        name: newName.trim(),
        patient_reference: newRef.trim() || undefined,
        wound_location: newLocation.trim(),
        wound_type: newWoundType,
        date_of_birth: newDob.trim() || undefined,
        contact_phone: newPhone.trim() || undefined,
      });

      setIsAddModalOpen(false);
      // Reset form
      setNewName('');
      setNewRef('');
      setNewLocation('');
      setNewDob('');
      setNewPhone('');
      fetchPatients();
      navigate(`/patients/${created.id}`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to register patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Patient Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered patients under smart dressing surveillance ({total} total)
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm shadow-teal-600/20 transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" /> Register New Patient
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or wound..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs text-navy-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="GREEN">Within Reference (Green)</option>
            <option value="AMBER">Needs Review (Amber)</option>
            <option value="RED">Priority Review (Red)</option>
            <option value="GRAY">Insufficient Quality / Uncalibrated (Gray)</option>
          </select>

          <button
            onClick={fetchPatients}
            className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Patients Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient Reference</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Wound Site & Classification</th>
                <th className="py-3 px-4">Total Scans</th>
                <th className="py-3 px-4">Latest Monitoring Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                      {patient.patient_reference}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy-900 text-sm">{patient.name}</div>
                      {patient.date_of_birth && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> DOB: {patient.date_of_birth}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                        {patient.wound_location}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Bandage className="w-3 h-3 text-slate-400" />
                        {patient.wound_type || 'General Wound'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {patient.total_scans ?? 0} scans
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={patient.latest_status || 'NO_SCANS'} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/scan/new?patient_id=${patient.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                        title="Scan Bandage"
                      >
                        <Camera className="w-3.5 h-3.5 text-teal-600" /> Scan
                      </Link>

                      <Link
                        to={`/patients/${patient.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
                      >
                        View History <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No patient records found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Patient Record"
        subtitle="Create a patient record for anthocyanin smart dressing monitoring"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreatePatient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reference ID (Auto-generated if empty)
              </label>
              <input
                type="text"
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                placeholder="e.g. HS-1005"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={newDob}
                onChange={(e) => setNewDob(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Wound Anatomical Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="e.g. Right lower extremity, lateral malleolus"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Wound Etiology / Type</label>
              <select
                value={newWoundType}
                onChange={(e) => setNewWoundType(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Diabetic Foot Ulcer">Diabetic Foot Ulcer</option>
                <option value="Post-Operative Surgical Wound">Post-Operative Surgical Wound</option>
                <option value="Venous Stasis Ulcer">Venous Stasis Ulcer</option>
                <option value="Pressure Injury (Decubitus)">Pressure Injury (Decubitus)</option>
                <option value="Partial-Thickness Thermal Burn">Partial-Thickness Thermal Burn</option>
                <option value="Traumatic Laceration">Traumatic Laceration</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-navy-900 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
