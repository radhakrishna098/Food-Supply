import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  ShieldCheck,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Package,
  Calendar,
  AlertTriangle,
  Building,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { StatusBadge, CategoryBadge, DietaryBadge } from '../components/Badge';
import ChatModal from '../components/ChatModal';

export default function DonationDetail() {
  const { id } = useParams();
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimQty, setClaimQty] = useState(0);
  const [claimNotes, setClaimNotes] = useState('');
  const [claimModal, setClaimModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [banner, setBanner] = useState({ text: '', type: '' });
  const [chatOpen, setChatOpen] = useState(false);

  const loadDonation = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/donations/${id}`);
      if (res.data.success) {
        setDonation(res.data.donation);
        setClaimQty(res.data.donation.remainingQuantity);
      }
    } catch (err) {
      console.error('Failed to load donation details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonation();
  }, [id]);

  const handleCancelDonation = async () => {
    if (!window.confirm('Are you certain you wish to cancel this surplus donation?')) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/donations/${id}/cancel`, { reason: 'Cancelled by donor' });
      if (res.data.success) {
        setBanner({ text: 'Donation has been cancelled.', type: 'info' });
        await loadDonation();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel donation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setBanner({ text: '', type: '' });

    try {
      const res = await api.post(`/donations/${id}/requests`, {
        requestedQuantity: Number(claimQty),
        recipientNotes: claimNotes || 'Immediate community food distribution',
      });

      if (res.data.success) {
        setBanner({ text: 'Claim request submitted! Donor has been alerted.', type: 'success' });
        setClaimModal(false);
        await loadDonation();
      }
    } catch (err) {
      setBanner({ text: err.response?.data?.message || 'Claim failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-xs text-stone-500">Loading donation details...</div>;
  }

  if (!donation) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold">Donation Not Found</h2>
        <Link to="/donations" className="text-forest-800 underline text-xs">Back to listings</Link>
      </div>
    );
  }

  const isOwner = user && (donation.donor?._id === user._id || donation.donor === user._id);
  const isClaimable = donation.status === 'AVAILABLE' || donation.status === 'PARTIALLY_CLAIMED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* HEADER WITH STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={donation.status} />
            <CategoryBadge category={donation.category} />
            {donation.pinCode && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-forest-900 text-forest-100">
                PIN {donation.pinCode}
              </span>
            )}
            {donation.donorType && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600">
                {donation.donorType.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            {donation.foodTitle}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Posted by <strong>{donation.donor?.name || 'Authorized Food Donor'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setChatOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-forest-800" />
            <span>Rescue Chat</span>
          </button>
          <Link
            to={`/matching/${donation._id}`}
            className="px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Matching Center</span>
          </Link>
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

      {/* MAIN CARD */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
        {donation.imageUrl && (
          <div className="h-64 sm:h-80 w-full overflow-hidden bg-cream-100">
            <img
              src={donation.imageUrl}
              alt={donation.foodTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-cream-50 border border-cream-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Available Quantity</span>
              <span className="font-extrabold text-stone-900 text-sm">
                {donation.remainingQuantity} {donation.unit}
              </span>
              <span className="text-[10px] text-stone-500 block">of {donation.quantity} {donation.unit}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Feeds Approx.</span>
              <span className="font-extrabold text-forest-800 text-sm">
                {donation.estimatedServings} Portions
              </span>
              <span className="text-[10px] text-stone-500 block">estimated yield</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Collection Deadline</span>
              <span className="font-extrabold text-red-600 text-sm">
                {new Date(donation.collectionWindow.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[10px] text-stone-500 block">
                {new Date(donation.collectionWindow.deadline).toLocaleDateString()}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Storage Method</span>
              <span className="font-bold text-stone-800 text-sm capitalize">
                {donation.storageAndHandling?.storageType?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
              Food Item Details & Preparation
            </h3>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              {donation.description || 'Freshly prepared nutritious food surplus.'}
            </p>
          </div>

          {/* Dietary & Allergens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                Dietary Classifications
              </span>
              <div className="flex flex-wrap gap-1">
                {donation.dietaryClassification?.map((d) => (
                  <DietaryBadge key={d} dietary={d} />
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                Allergen Information
              </span>
              <p className="text-stone-700 font-medium">
                {donation.allergenInfo?.length > 0
                  ? donation.allergenInfo.join(', ')
                  : 'No specific allergens declared by kitchen'}
              </p>
            </div>
          </div>

          {/* Location & Instructions */}
          <div className="pt-2 border-t border-stone-100 space-y-2 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Pickup & Transit Details
            </h3>
            <p className="flex items-center gap-1.5 text-stone-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
              <span>{donation.pickupAddress?.formattedAddress}</span>
            </p>
            {donation.specialCollectionInstructions && (
              <p className="text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <strong>Courier Note:</strong> {donation.specialCollectionInstructions}
              </p>
            )}
          </div>

          {/* Donor Safety Certification Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Donor Food Safety Certification</span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Affirmed by <strong>{donation.safetyDeclaration?.declaredBy}</strong> at{' '}
              {new Date(donation.safetyDeclaration?.declaredAt).toLocaleString()}. Certified safe, maintained at hygienic temperature thresholds, and stored in clean food-grade containers.
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            {isOwner ? (
              <div className="flex items-center gap-3">
                {donation.status === 'AVAILABLE' && (
                  <button
                    onClick={handleCancelDonation}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors"
                  >
                    Cancel Listing
                  </button>
                )}
                <Link
                  to={`/matching/${donation._id}`}
                  className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>View Ranked Recipient Matches</span>
                </Link>
              </div>
            ) : user?.role === 'recipient' ? (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isClaimable ? (
                  <button
                    onClick={() => setClaimModal(true)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Claim Surplus for Your Shelter</span>
                  </button>
                ) : (
                  <span className="text-xs text-stone-500 font-semibold">
                    This donation is currently {donation.status.toLowerCase()} and cannot be claimed.
                  </span>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-forest-800 hover:underline"
              >
                Log in as verified NGO to claim this surplus →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* CLAIM MODAL */}
      {claimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-base text-stone-900">
              Claim Surplus Food: {donation.foodTitle}
            </h3>

            <p className="text-xs text-stone-500">
              Enter portion quantity to claim. Remaining quantity will be locked atomically to prevent duplicate allocation.
            </p>

            <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Quantity ({donation.unit})
                </label>
                <input
                  type="number"
                  min={1}
                  max={donation.remainingQuantity}
                  required
                  value={claimQty}
                  onChange={(e) => setClaimQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Intake Notes
                </label>
                <textarea
                  rows={2}
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="Notes for food donor and courier..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Confirm Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCUE COORDINATION CHAT MODAL */}
      <ChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        donationId={donation._id}
        donationTitle={donation.foodTitle}
        contactName={donation.donor?.name || donation.donorOrg?.name}
        contactPhone={donation.donor?.phone || donation.donorOrg?.contactPhone}
      />
    </div>
  );
}
