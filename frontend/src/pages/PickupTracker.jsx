import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Navigation,
  ArrowRight,
  Package,
  MessageSquare,
} from 'lucide-react';
import { StatusBadge, CategoryBadge } from '../components/Badge';
import ChatModal from '../components/ChatModal';

export default function PickupTracker() {
  const { id } = useParams();
  const { user } = useAuth();

  const [pickups, setPickups] = useState([]);
  const [activePickup, setActivePickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpModal, setOtpModal] = useState({ open: false, type: 'pickup' });
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [discrepancyModal, setDiscrepancyModal] = useState(false);
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [banner, setBanner] = useState({ text: '', type: '' });
  const [chatOpen, setChatOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      if (id) {
        const res = await api.get(`/pickups/${id}`);
        if (res.data.success) {
          setActivePickup(res.data.pickup);
        }
      } else {
        const res = await api.get('/pickups');
        if (res.data.success) {
          setPickups(res.data.pickups);
          if (res.data.pickups.length > 0) {
            setActivePickup(res.data.pickups[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load pickup data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleClaimTask = async (pickupId) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/pickups/${pickupId}/assign`);
      if (res.data.success) {
        setBanner({ text: 'Task accepted! You are now the assigned courier.', type: 'success' });
        await loadData();
      }
    } catch (err) {
      setBanner({ text: err.response?.data?.message || 'Failed to accept task', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (nextStatus) => {
    if (!activePickup) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/pickups/${activePickup._id}/status`, { status: nextStatus });
      if (res.data.success) {
        setBanner({ text: `Status updated to ${nextStatus.replace(/_/g, ' ')}`, type: 'success' });
        await loadData();
      }
    } catch (err) {
      setBanner({ text: err.response?.data?.message || 'Failed to update status', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setActionLoading(true);

    try {
      const res = await api.post(`/pickups/${activePickup._id}/verify-handover`, {
        handoverType: otpModal.type,
        code: otpCode,
      });

      if (res.data.success) {
        setBanner({
          text: otpModal.type === 'pickup'
            ? 'Pickup verified! Surplus food marked as COLLECTED and in transit.'
            : 'Delivery verified! Rescue mission DELIVERED and impact recorded.',
          type: 'success',
        });
        setOtpModal({ open: false, type: 'pickup' });
        setOtpCode('');
        await loadData();
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid handover code.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportDiscrepancy = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.post(`/pickups/${activePickup._id}/discrepancy`, {
        notes: discrepancyNotes,
      });
      if (res.data.success) {
        setBanner({ text: 'Discrepancy logged for administrator review.', type: 'info' });
        setDiscrepancyModal(false);
        setDiscrepancyNotes('');
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to report discrepancy');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !activePickup) {
    return <div className="p-16 text-center text-xs text-stone-500">Loading rescue missions...</div>;
  }

  const isAssignedCourier =
    user && (activePickup?.assignedVolunteer?._id === user._id || activePickup?.assignedVolunteer === user._id);
  const isDonorOwner =
    user && (activePickup?.donor?._id === user._id || activePickup?.donor === user._id);
  const isRecipientUser =
    user && (activePickup?.recipientUser?._id === user._id || activePickup?.recipientUser === user._id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Logistics & Courier Coordination
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Surplus Rescue Pickup & Delivery Tracker
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            End-to-end custody verification with cryptographic OTP handovers
          </p>
        </div>
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

      {/* TWO COLUMN LAYOUT: MISSIONS LIST + ACTIVE MISSION DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Missions List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Your Active / Assigned Missions ({pickups.length || (activePickup ? 1 : 0)})
          </h2>

          <div className="space-y-3">
            {(pickups.length > 0 ? pickups : activePickup ? [activePickup] : []).map((p) => (
              <div
                key={p._id}
                onClick={() => setActivePickup(p)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activePickup?._id === p._id
                    ? 'bg-white border-forest-800 shadow-md ring-1 ring-forest-800'
                    : 'bg-white/80 border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <StatusBadge status={p.status} />
                  <span className="text-[10px] text-stone-400">
                    {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-stone-900 line-clamp-1">
                  {p.donation?.foodTitle || 'Surplus Food Batch'}
                </h4>
                <p className="text-[11px] text-stone-500 mt-1 truncate">
                  To: {p.recipientOrg?.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Mission Controller & Details */}
        <div className="lg:col-span-2 space-y-6">
          {activePickup ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
              {/* Mission Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={activePickup.status} />
                    <CategoryBadge category={activePickup.donation?.category || 'prepared_meals'} />
                  </div>
                  <h2 className="text-xl font-extrabold text-stone-900">
                    {activePickup.donation?.foodTitle}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Mission #{String(activePickup._id).slice(-6)}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => setChatOpen(true)}
                    className="px-3.5 py-2.5 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Rescue Chat</span>
                  </button>

                  {/* Handover OTP Box */}
                  {isDonorOwner && activePickup.pickupCode && (
                    <div className="bg-emerald-50 border-2 border-emerald-500 px-4 py-2 rounded-2xl text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                        Donor Pickup OTP
                      </span>
                      <span className="font-mono text-xl font-black text-emerald-950 tracking-wider">
                        {activePickup.pickupCode}
                      </span>
                      <span className="text-[9px] text-emerald-700 block">Give to courier at pickup</span>
                    </div>
                  )}

                  {isRecipientUser && activePickup.deliveryCode && (
                    <div className="bg-amber-50 border-2 border-amber-500 px-4 py-2 rounded-2xl text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">
                        NGO Delivery OTP
                      </span>
                      <span className="font-mono text-xl font-black text-amber-950 tracking-wider">
                        {activePickup.deliveryCode}
                      </span>
                      <span className="text-[9px] text-amber-700 block">Give to courier upon arrival</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Waypoints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Pickup Origin</span>
                  <p className="font-bold text-stone-800 text-sm">{activePickup.donor?.name}</p>
                  <p className="text-stone-600">{activePickup.pickupAddress?.formattedAddress}</p>
                  <p className="text-[11px] text-stone-400 pt-1">Phone: {activePickup.donor?.phone || 'N/A'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Delivery Destination</span>
                  <p className="font-bold text-stone-800 text-sm">{activePickup.recipientOrg?.name}</p>
                  <p className="text-stone-600">{activePickup.deliveryAddress?.formattedAddress}</p>
                  <p className="text-[11px] text-stone-400 pt-1">Recipient: {activePickup.recipientUser?.name}</p>
                </div>
              </div>

              {/* COURIER STATE CONTROLLER (If courier or admin) */}
              {(isAssignedCourier || user?.role === 'admin') && activePickup.status !== 'DELIVERED' && (
                <div className="p-5 rounded-2xl bg-stone-900 text-white space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest-300 block">
                    Courier Action Controls
                  </span>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    {activePickup.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleClaimTask(activePickup._id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 font-bold"
                      >
                        Accept Courier Assignment
                      </button>
                    )}

                    {activePickup.status === 'ACCEPTED_BY_VOLUNTEER' && (
                      <button
                        onClick={() => handleStatusUpdate('EN_ROUTE')}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 font-bold flex items-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Start Transit (En Route)</span>
                      </button>
                    )}

                    {activePickup.status === 'EN_ROUTE' && (
                      <button
                        onClick={() => handleStatusUpdate('ARRIVED_AT_DONOR')}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 font-bold flex items-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Arrived at Donor</span>
                      </button>
                    )}

                    {activePickup.status === 'ARRIVED_AT_DONOR' && (
                      <button
                        onClick={() => setOtpModal({ open: true, type: 'pickup' })}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-black flex items-center gap-1.5 shadow animate-pulse"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Verify Donor Pickup OTP</span>
                      </button>
                    )}

                    {activePickup.status === 'COLLECTED' && (
                      <button
                        onClick={() => handleStatusUpdate('ARRIVED_AT_RECIPIENT')}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 font-bold flex items-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Arrived at Recipient Shelter</span>
                      </button>
                    )}

                    {activePickup.status === 'ARRIVED_AT_RECIPIENT' && (
                      <button
                        onClick={() => setOtpModal({ open: true, type: 'delivery' })}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-black flex items-center gap-1.5 shadow animate-pulse"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Verify NGO Delivery OTP</span>
                      </button>
                    )}

                    <button
                      onClick={() => setDiscrepancyModal(true)}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 font-semibold text-xs ml-auto"
                    >
                      Report Discrepancy
                    </button>
                  </div>
                </div>
              )}

              {/* TIMELINE AUDIT TRAIL */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Custody Chain & Handover Timeline
                </h3>

                <div className="space-y-3 border-l-2 border-stone-200 pl-4 ml-2 text-xs">
                  {activePickup.timeline?.map((step, idx) => (
                    <div key={idx} className="relative space-y-0.5">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-forest-800 border-2 border-white"></div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{step.status.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-stone-600 text-[11px]">{step.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-xs text-stone-400 border border-stone-200">
              Select a mission from the list to view custody details and handover verification.
            </div>
          )}
        </div>
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
                  ? 'Ask the donor kitchen rep for their 6-digit collection OTP.'
                  : 'Ask the shelter rep for their 6-digit delivery confirmation OTP.'}
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
                  onClick={() => setOtpModal({ open: false, type: 'pickup' })}
                  className="w-1/2 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || otpCode.length !== 6}
                  className="w-1/2 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow disabled:opacity-50"
                >
                  {actionLoading ? 'Verifying...' : 'Submit OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCREPANCY REPORT MODAL */}
      {discrepancyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-base text-stone-900">
              Report Mission Discrepancy
            </h3>
            <p className="text-xs text-stone-500">
              Log damaged packaging, missing containers, or timing anomalies for platform audit.
            </p>
            <form onSubmit={handleReportDiscrepancy} className="space-y-3">
              <textarea
                rows={3}
                required
                value={discrepancyNotes}
                onChange={(e) => setDiscrepancyNotes(e.target.value)}
                placeholder="Describe the discrepancy..."
                className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDiscrepancyModal(false)}
                  className="w-1/2 py-2 rounded-xl bg-stone-100 text-xs font-bold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCUE COORDINATION CHAT MODAL */}
      {activePickup && (
        <ChatModal
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          donationId={activePickup.donation?._id || activePickup.donation}
          donationTitle={activePickup.donation?.foodTitle || 'Surplus Rescue Delivery'}
          contactName={
            isDonorOwner
              ? activePickup.recipientOrg?.name
              : activePickup.donor?.name || 'Partner'
          }
          contactPhone={
            isDonorOwner
              ? activePickup.recipientOrg?.contactPhone || activePickup.recipientUser?.phone
              : activePickup.donor?.phone
          }
        />
      )}
    </div>
  );
}
