import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Package,
  KeyRound,
  Navigation,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { StatusBadge, CategoryBadge } from '../components/Badge';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [availableTasks, setAvailableTasks] = useState([]);
  const [myMissions, setMyMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpModal, setOtpModal] = useState({ open: false, pickupId: null, type: 'pickup' });
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [availableRes, myRes] = await Promise.all([
        api.get('/pickups?availableTasks=true'),
        api.get('/pickups'),
      ]);

      if (availableRes.data.success) setAvailableTasks(availableRes.data.pickups);
      if (myRes.data.success) setMyMissions(myRes.data.pickups);
    } catch (err) {
      console.error('Failed to load volunteer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaimTask = async (taskId) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/pickups/${taskId}/assign`);
      if (res.data.success) {
        setSuccessBanner('Mission accepted! You are now assigned to this food rescue pickup.');
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (pickupId, nextStatus) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/pickups/${pickupId}/status`, { status: nextStatus });
      if (res.data.success) {
        setSuccessBanner(`Mission status updated to: ${nextStatus.replace(/_/g, ' ')}`);
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setActionLoading(true);

    try {
      const res = await api.post(`/pickups/${otpModal.pickupId}/verify-handover`, {
        handoverType: otpModal.type,
        code: otpCode,
      });

      if (res.data.success) {
        setSuccessBanner(
          otpModal.type === 'pickup'
            ? 'Pickup verified! Food is collected and in transit.'
            : 'Delivery verified! Rescue mission completed successfully.'
        );
        setOtpModal({ open: false, pickupId: null, type: 'pickup' });
        setOtpCode('');
        await loadData();
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setActionLoading(false);
    }
  };

  const activeMission = myMissions.find(
    (m) => m.status !== 'DELIVERED' && m.status !== 'CANCELLED' && m.status !== 'FAILED'
  );
  const completedMissions = myMissions.filter((m) => m.status === 'DELIVERED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Volunteer Courier Dispatch Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-0.5">
            Courier {user.name}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Transport: <strong>{user.volunteerProfile?.vehicleType?.toUpperCase() || 'CAR'}</strong> • Service Radius: {user.volunteerProfile?.serviceRadiusKm || 25} km • Status: Available
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs">
            {completedMissions.length} Missions Completed
          </span>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner('')} className="underline text-emerald-900 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Completed Deliveries"
          value={completedMissions.length}
          subtitle="Verified handovers"
          icon={CheckCircle2}
          color="forest"
        />
        <StatCard
          title="Active Missions"
          value={activeMission ? 1 : 0}
          subtitle="Currently underway"
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="Tasks Available"
          value={availableTasks.length}
          subtitle="Awaiting courier pickup"
          icon={Package}
          color="terracotta"
        />
        <StatCard
          title="Estimated Impact"
          value={`${completedMissions.reduce((sum, m) => sum + (m.donation?.estimatedServings || 0), 0)} meals`}
          subtitle="Delivered to community"
          icon={ShieldCheck}
          color="amber"
        />
      </div>

      {/* ACTIVE MISSION CONTROLLER (The Step-by-Step Courier State Machine) */}
      {activeMission && (
        <div className="bg-gradient-to-br from-forest-900 to-forest-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-forest-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-300">
                Active Live Mission In Progress
              </span>
              <h2 className="text-xl sm:text-2xl font-black mt-0.5">
                {activeMission.donation?.foodTitle}
              </h2>
            </div>
            <StatusBadge status={activeMission.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Pickup Site */}
            <div className="p-4 rounded-2xl bg-forest-800/80 border border-forest-700 space-y-1">
              <span className="text-[10px] uppercase font-bold text-forest-300">Pickup Location (Donor)</span>
              <h4 className="font-bold text-sm text-white">{activeMission.donor?.name}</h4>
              <p className="text-forest-200">{activeMission.pickupAddress?.formattedAddress}</p>
            </div>

            {/* Delivery Site */}
            <div className="p-4 rounded-2xl bg-forest-800/80 border border-forest-700 space-y-1">
              <span className="text-[10px] uppercase font-bold text-forest-300">Delivery Location (Recipient)</span>
              <h4 className="font-bold text-sm text-white">{activeMission.recipientOrg?.name}</h4>
              <p className="text-forest-200">{activeMission.deliveryAddress?.formattedAddress}</p>
            </div>
          </div>

          {/* STEP CONTROLLER BUTTONS */}
          <div className="p-4 rounded-2xl bg-forest-800/60 border border-forest-700/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest-200">
              Courier Mission Progression:
            </h4>

            <div className="flex flex-wrap items-center gap-3">
              {activeMission.status === 'ACCEPTED_BY_VOLUNTEER' && (
                <button
                  onClick={() => handleStatusUpdate(activeMission._id, 'EN_ROUTE')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Start Travel (Mark En Route)</span>
                </button>
              )}

              {activeMission.status === 'EN_ROUTE' && (
                <button
                  onClick={() => handleStatusUpdate(activeMission._id, 'ARRIVED_AT_DONOR')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Arrived at Donor Kitchen</span>
                </button>
              )}

              {activeMission.status === 'ARRIVED_AT_DONOR' && (
                <button
                  onClick={() => setOtpModal({ open: true, pickupId: activeMission._id, type: 'pickup' })}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 animate-pulse"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Verify Donor Pickup OTP Code</span>
                </button>
              )}

              {activeMission.status === 'COLLECTED' && (
                <button
                  onClick={() => handleStatusUpdate(activeMission._id, 'ARRIVED_AT_RECIPIENT')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Arrived at Recipient Shelter</span>
                </button>
              )}

              {activeMission.status === 'ARRIVED_AT_RECIPIENT' && (
                <button
                  onClick={() => setOtpModal({ open: true, pickupId: activeMission._id, type: 'delivery' })}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 animate-pulse"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Verify Recipient Delivery OTP Code</span>
                </button>
              )}

              <Link
                to={`/pickups/${activeMission._id}`}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
              >
                View Detailed Route & Timeline
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* AVAILABLE TASKS BOARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-lg text-stone-900">
              Available Courier Rescue Tasks
            </h2>
            <p className="text-xs text-stone-500">
              Tasks accepted by donors and ready for immediate courier dispatch
            </p>
          </div>
        </div>

        {availableTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            No unassigned tasks currently waiting. You will receive an in-app alert when a new rescue mission is approved.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableTasks.map((t) => (
              <div
                key={t._id}
                className="p-5 rounded-2xl bg-cream-50 border border-stone-200 shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Ready for Courier
                    </span>
                    <span className="text-xs font-bold text-stone-700">
                      {t.donation?.remainingQuantity || t.donation?.quantity} {t.donation?.unit}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 mt-1">{t.donation?.foodTitle}</h3>
                  <div className="text-xs text-stone-600 space-y-1 mt-2">
                    <p className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                      <span>From: {t.pickupAddress?.formattedAddress}</span>
                    </p>
                    <p className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
                      <span>To: {t.recipientOrg?.name} ({t.deliveryAddress?.formattedAddress})</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">
                    Feeds approx. {t.donation?.estimatedServings} people
                  </span>
                  <button
                    onClick={() => handleClaimTask(t._id)}
                    disabled={actionLoading || !!activeMission}
                    className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-40"
                    title={activeMission ? 'Complete active mission before claiming new tasks' : ''}
                  >
                    Accept Mission
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OTP HANDOVER MODAL */}
      {otpModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-stone-900">
                {otpModal.type === 'pickup' ? 'Enter Donor Pickup Code' : 'Enter Recipient Delivery Code'}
              </h3>
              <p className="text-xs text-stone-500">
                {otpModal.type === 'pickup'
                  ? 'Ask the Donor representative for the 6-digit code shown on their dashboard screen.'
                  : 'Ask the Recipient NGO shelter representative for their 6-digit delivery confirmation code.'}
              </p>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-Digit OTP"
                  className="w-full text-center font-mono text-2xl font-extrabold tracking-widest py-3 rounded-2xl border-2 border-stone-300 focus:border-forest-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOtpModal({ open: false, pickupId: null, type: 'pickup' })}
                  className="w-1/2 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || otpCode.length !== 6}
                  className="w-1/2 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow disabled:opacity-50"
                >
                  {actionLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
