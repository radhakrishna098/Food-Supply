import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Building,
  ShieldCheck,
  ShieldAlert,
  Save,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function ProfileSettings() {
  const { user, organization, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [address, setAddress] = useState(organization?.address?.formattedAddress || '');
  const [capacity, setCapacity] = useState(organization?.maxDailyCapacityServings || 100);
  const [serviceRadius, setServiceRadius] = useState(organization?.serviceRadiusKm || 15);
  const [hasVehicle, setHasVehicle] = useState(organization?.hasVehicle || false);

  // Verification modal state
  const [docType, setDocType] = useState('Society Registration / 80G Tax Exemption');
  const [docNumber, setDocNumber] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [banner, setBanner] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBanner({ text: '', type: '' });

    try {
      await api.patch('/auth/profile', { name, phone });

      if (organization) {
        await api.patch('/organizations/me', {
          name: orgName,
          formattedAddress: address,
          maxDailyCapacityServings: Number(capacity),
          serviceRadiusKm: Number(serviceRadius),
          hasVehicle,
        });
      }

      await refreshUser();
      setBanner({ text: 'Profile & logistics settings saved successfully.', type: 'success' });
    } catch (err) {
      setBanner({ text: err.response?.data?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!docNumber) return;
    setLoading(true);
    setBanner({ text: '', type: '' });

    try {
      const res = await api.post('/organizations/me/verification', {
        docType,
        docNumber,
        notes: docNotes,
      });

      if (res.data.success) {
        await refreshUser();
        setBanner({
          text: 'Verification application submitted! A platform administrator will review your credentials.',
          type: 'success',
        });
        setDocNumber('');
        setDocNotes('');
      }
    } catch (err) {
      setBanner({ text: err.response?.data?.message || 'Failed to submit verification', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
          Account & Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
          Profile & Organization Settings
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Manage your contact information, service radius, and intake capacities
        </p>
      </div>

      {banner.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold ${
            banner.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* USER DETAILS */}
      <form onSubmit={handleProfileSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
        <h2 className="text-base font-extrabold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-forest-800" />
          <span>User Account Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
              Full Name / Representative
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
              Email Address (Login ID)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
              Account Role
            </label>
            <input
              type="text"
              disabled
              value={user?.role?.toUpperCase() || ''}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 font-bold text-stone-600"
            />
          </div>
        </div>

        {/* ORG DETAILS */}
        {organization && (
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-700" />
              <span>Organization Logistics & Capacity</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Operating Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Max Daily Capacity (Servings)
                </label>
                <input
                  type="number"
                  min={10}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Service Radius (km)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 pt-1">
              <input
                type="checkbox"
                checked={hasVehicle}
                onChange={(e) => setHasVehicle(e.target.checked)}
                className="w-4 h-4 text-forest-800 rounded"
              />
              <span>Organization operates internal transport fleet for self-pickup</span>
            </label>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* VERIFICATION APPLICATION (For Recipient NGOs) */}
      {organization && user?.role === 'recipient' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-700" />
                <span>Institutional Verification Credentials</span>
              </h2>
              <p className="text-xs text-stone-500">
                Submit charity registration documents for administrator verification
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                organization.verificationStatus === 'verified'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Status: {organization.verificationStatus}
            </span>
          </div>

          <form onSubmit={handleVerificationSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                >
                  <option value="Society Registration / 80G Tax Exemption">Society Registration / 80G</option>
                  <option value="Trust Deed / Charity Commissioner Cert">Trust Deed / Charity Cert</option>
                  <option value="Food Safety Standards (FSSAI) License">Food Safety (FSSAI) License</option>
                  <option value="Municipal Shelter Authorization">Municipal Shelter Authorization</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Registration / Certificate ID Number *
                </label>
                <input
                  type="text"
                  required
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. DEL-NGO-99210-2024"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Verification Notes or Document Link
              </label>
              <input
                type="text"
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                placeholder="https://drive.google.com/cert.pdf or registration notes"
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Submit for Admin Audit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
