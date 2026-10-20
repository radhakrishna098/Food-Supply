import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  Plus,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Truck,
  Sparkles,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { StatusBadge, CategoryBadge } from '../components/Badge';

export default function DonorDashboard() {
  const { user, organization } = useAuth();
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [donationsRes, requestsRes, pickupsRes, analyticsRes] = await Promise.all([
        api.get('/donations?myDonations=true'),
        api.get('/requests/me'),
        api.get('/pickups'),
        api.get('/analytics/overview'),
      ]);

      if (donationsRes.data.success) setDonations(donationsRes.data.donations);
      if (requestsRes.data.success) setRequests(requestsRes.data.requests);
      if (pickupsRes.data.success) setPickups(pickupsRes.data.pickups);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
    } catch (err) {
      console.error('Failed to load donor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/requests/${requestId}/accept`, {
        donorNotes: 'Accepted for immediate pickup dispatch',
      });
      if (res.data.success) {
        setMessage('Claim request accepted! A volunteer courier task has been created.');
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm('Are you sure you wish to decline this claim request?')) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/requests/${requestId}/reject`, {
        reason: 'Declined due to scheduling constraint',
      });
      if (res.data.success) {
        setMessage('Request declined. Food quantity restored to available inventory.');
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const activePickups = pickups.filter((p) => p.status !== 'DELIVERED' && p.status !== 'CANCELLED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Donor Operations Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-0.5">
            Welcome, {user.name}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {organization?.name || 'Commercial Kitchen'} • {organization?.address?.formattedAddress || 'Connaught Place'}
          </p>
        </div>

        <Link
          to="/donations/create"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Surplus Food</span>
        </Link>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="font-bold underline text-emerald-900">
            Dismiss
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Posted"
          value={donations.length}
          subtitle="Donation batches"
          icon={UtensilsCrossed}
          color="forest"
        />
        <StatCard
          title="Active Missions"
          value={activePickups.length}
          subtitle="In transit or scheduled"
          icon={Truck}
          color="terracotta"
        />
        <StatCard
          title="Pending NGO Claims"
          value={pendingRequests.length}
          subtitle="Awaiting your approval"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Rescued Meals"
          value={analytics?.userStats?.servingsRescued || (analytics?.totalServingsRescued ? 80 : 0)}
          subtitle="Portions delivered to shelters"
          icon={ShieldCheck}
          color="blue"
        />
      </div>

      {/* CRITICAL ACTION: PENDING NGO REQUESTS AWAITING APPROVAL */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
              <h2 className="font-extrabold text-base text-amber-950">
                Action Required: {pendingRequests.length} Recipient Claim Request(s)
              </h2>
            </div>
            <span className="text-xs font-semibold text-amber-800">
              Review and approve to dispatch courier
            </span>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">
                      {req.recipientOrg?.name}
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase">
                      {req.recipientOrg?.type?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Requested: <strong>{req.requestedQuantity} {req.donation?.unit}</strong> ({req.requestedServings} estimated servings) of <em>{req.donation?.foodTitle}</em>
                  </p>
                  {req.matchScoreSnapshot?.totalScore > 0 && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-stone-500">
                      <span className="text-forest-700 font-bold">
                        {req.matchScoreSnapshot.totalScore}% Feasibility Score
                      </span>
                      <span>•</span>
                      <span>{req.matchScoreSnapshot.distanceKm} km away</span>
                      <span>•</span>
                      <span>{req.recipientOrg?.address?.formattedAddress}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleRejectRequest(req._id)}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(req._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Claim</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE PICKUPS & VERIFICATION CODES */}
      {activePickups.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-lg text-stone-900">
                Active Courier Pickups & Handover OTP
              </h2>
              <p className="text-xs text-stone-500">
                Give this 6-digit pickup code to the volunteer courier when they arrive at your kitchen
              </p>
            </div>
            <Truck className="w-5 h-5 text-forest-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePickups.map((p) => (
              <div
                key={p._id}
                className="p-5 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <StatusBadge status={p.status} />
                    <h3 className="font-bold text-sm text-stone-900 mt-2">{p.donation?.foodTitle}</h3>
                    <p className="text-xs text-stone-600">
                      Destination: <strong>{p.recipientOrg?.name}</strong>
                    </p>
                  </div>

                  {/* Donor's pickup code box */}
                  <div className="bg-white px-3 py-2 rounded-xl border-2 border-forest-800 shadow-sm text-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                      Pickup OTP
                    </span>
                    <span className="font-mono text-base font-extrabold text-forest-900 tracking-wider">
                      {p.pickupCode || '••••••'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                  <span>Courier: {p.assignedVolunteer?.name || 'Awaiting volunteer'}</span>
                  <Link
                    to={`/pickups/${p._id}`}
                    className="text-forest-800 font-bold hover:underline"
                  >
                    Live Tracker →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY POSTED DONATIONS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-lg text-stone-900">
              Your Food Rescue Listings
            </h2>
            <p className="text-xs text-stone-500">
              Monitor active batches, collection deadlines, and smart matching recommendations
            </p>
          </div>
        </div>

        {donations.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            You have not posted any surplus donations yet. Click "Post New Surplus Food" to start rescuing meals.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {donations.map((d) => (
              <div key={d._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    <CategoryBadge category={d.category} />
                    <h3 className="font-bold text-sm text-stone-900">{d.foodTitle}</h3>
                  </div>
                  <p className="text-xs text-stone-600">
                    Remaining: <strong>{d.remainingQuantity} {d.unit}</strong> of {d.quantity} {d.unit} ({d.estimatedServings} servings)
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span>Deadline: {new Date(d.collectionWindow.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>Safety Declared by: {d.safetyDeclaration?.declaredBy || 'Authorized Chef'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    to={`/matching/${d._id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-xs border border-forest-200 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-forest-700" />
                    <span>Matching Center</span>
                  </Link>
                  <Link
                    to={`/donations/${d._id}`}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
