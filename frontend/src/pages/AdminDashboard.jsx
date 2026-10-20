import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  ShieldCheck,
  Building,
  Users,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [banner, setBanner] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, verificationsRes, auditsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/admin/verifications?status=pending'),
        api.get('/admin/audit-logs?limit=8'),
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
      if (verificationsRes.data.success) setPendingVerifications(verificationsRes.data.organizations);
      if (auditsRes.data.success) setRecentAudits(auditsRes.data.logs);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewVerification = async (orgId, decision) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/admin/organizations/${orgId}/verification`, {
        decision,
        rejectionReason: decision === 'rejected' ? 'Documentation does not meet institutional standards' : '',
      });
      if (res.data.success) {
        setBanner(`Organization verification decision recorded: ${decision.toUpperCase()}`);
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update verification status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
            System Governance & Audit Command
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-0.5">
            Platform Administration
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Audit logs, NGO verification approvals, and ecosystem health monitoring
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/admin/audit-logs"
            className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs border border-purple-200 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Full Audit Trail</span>
          </Link>
          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>User Accounts</span>
          </Link>
        </div>
      </div>

      {banner && (
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-900 flex items-center justify-between">
          <span>{banner}</span>
          <button onClick={() => setBanner('')} className="underline text-purple-950 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Applications"
          value={pendingVerifications.length}
          subtitle="NGOs awaiting audit"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Verified NGOs"
          value={analytics?.verifiedNgoCount || 0}
          subtitle="Eligible charities"
          icon={Building}
          color="forest"
        />
        <StatCard
          title="Registered Donors"
          value={analytics?.activeDonorCount || 0}
          subtitle="Restaurants & kitchens"
          icon={UtensilsCrossed}
          color="terracotta"
        />
        <StatCard
          title="Volunteer Couriers"
          value={analytics?.activeVolunteerCount || 0}
          subtitle="Active logistics pool"
          icon={Users}
          color="blue"
        />
      </div>

      {/* PENDING NGO VERIFICATION APPLICATIONS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-lg text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-700" />
              <span>Pending Recipient Organization Applications</span>
            </h2>
            <p className="text-xs text-stone-500">
              Review charity tax registration, food handling capacity, and approve claims clearance
            </p>
          </div>
          <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
            {pendingVerifications.length} Pending
          </span>
        </div>

        {pendingVerifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            All recipient organization verification applications have been reviewed. No pending items.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {pendingVerifications.map((org) => (
              <div
                key={org._id}
                className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-stone-900">{org.name}</h3>
                    <span className="text-[10px] font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full uppercase">
                      {org.type?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600">
                    Representative: <strong>{org.owner?.name}</strong> ({org.owner?.email}) • Phone: {org.owner?.phone || 'N/A'}
                  </p>

                  <p className="text-xs text-stone-500">
                    Location: {org.address?.formattedAddress} • Daily Intake Capacity: {org.maxDailyCapacityServings} servings
                  </p>

                  {org.verificationDocuments && org.verificationDocuments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      {org.verificationDocuments.map((doc, idx) => (
                        <span
                          key={idx}
                          className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md font-mono"
                        >
                          {doc.docType}: {doc.docNumber}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleReviewVerification(org._id, 'rejected')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-red-50 text-red-700 font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleReviewVerification(org._id, 'verified')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Verify</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REAL-TIME AUDIT LOG FEED */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-lg text-stone-900">
              Live Immutable Audit Trail
            </h2>
            <p className="text-xs text-stone-500">
              Recorded cryptographic state transitions, OTP confirmations, and role actions
            </p>
          </div>

          <Link
            to="/admin/audit-logs"
            className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentAudits.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">No audit events recorded yet.</div>
        ) : (
          <div className="divide-y divide-stone-100 text-xs font-mono">
            {recentAudits.map((log) => (
              <div key={log._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-stone-500 font-sans font-medium text-xs">
                      on <strong>{log.entityType}</strong> #{String(log.entityId).slice(-6)}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-sans">
                    Actor: {log.actorName} ({log.actorRole})
                  </p>
                </div>

                <div className="text-[11px] text-stone-400 font-sans self-start sm:self-auto">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
