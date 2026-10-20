import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { ShieldCheck, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

export default function AdminVerifications() {
  const [organizations, setOrganizations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/verifications?status=${statusFilter}`);
      if (res.data.success) {
        setOrganizations(res.data.organizations);
      }
    } catch (err) {
      console.error('Failed to load verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleReview = async (orgId, decision) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/admin/organizations/${orgId}/verification`, {
        decision,
        rejectionReason: decision === 'rejected' ? 'Documentation does not meet platform requirements' : '',
      });
      if (res.data.success) {
        setMessage(`Organization verification status updated to '${decision}'`);
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Review failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
            Institutional Vetting
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Recipient Organization Verification Queue
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Audit charity registration certificates, tax exemptions, and food storage capacities
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-cream-200/80 p-1 border border-stone-300 text-xs font-bold">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'pending' ? 'bg-white shadow-sm text-forest-900' : 'text-stone-600'
            }`}
          >
            Pending Queue
          </button>
          <button
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'verified' ? 'bg-white shadow-sm text-forest-900' : 'text-stone-600'
            }`}
          >
            Verified NGOs
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'rejected' ? 'bg-white shadow-sm text-forest-900' : 'text-stone-600'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="underline text-emerald-950">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading verification applications...</div>
        ) : organizations.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            No organization applications found with status '{statusFilter}'.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 text-xs">
            {organizations.map((org) => (
              <div key={org._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-stone-900">{org.name}</h3>
                    <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                      {org.type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono bg-purple-50 text-purple-800 px-2 py-0.5 rounded">
                      Cap: {org.maxDailyCapacityServings} servings/day
                    </span>
                  </div>

                  <p className="text-xs text-stone-600">
                    Representative: <strong>{org.owner?.name}</strong> ({org.owner?.email}) • Phone: {org.owner?.phone || 'N/A'}
                  </p>
                  <p className="text-xs text-stone-500">
                    Address: {org.address?.formattedAddress}
                  </p>

                  {org.verificationDocuments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                      {org.verificationDocuments.map((doc, idx) => (
                        <span key={idx} className="bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg">
                          📄 {doc.docType}: <strong>{doc.docNumber}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  {statusFilter === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReview(org._id, 'rejected')}
                        disabled={actionLoading}
                        className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-red-50 text-red-700 font-bold text-xs"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleReview(org._id, 'verified')}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Verify</span>
                      </button>
                    </>
                  )}
                  {statusFilter === 'verified' && (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
