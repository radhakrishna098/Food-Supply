import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Truck,
  Building,
  Sliders,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { StatusBadge, CategoryBadge, DietaryBadge, ScoreBadge } from '../components/Badge';
import ChatModal from '../components/ChatModal';

export default function SmartMatchingCenter() {
  const { donationId } = useParams();
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [maxRadiusOverride, setMaxRadiusOverride] = useState(15);
  const [loading, setLoading] = useState(true);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimQuantity, setClaimQuantity] = useState(0);
  const [claimNotes, setClaimNotes] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimError, setClaimError] = useState('');
  const [expandedBreakdown, setExpandedBreakdown] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState({ name: '', phone: '' });

  const fetchMatches = async (radius) => {
    try {
      setLoading(true);
      const url = radius ? `/matching/${donationId}?maxRadius=${radius}` : `/matching/${donationId}`;
      const res = await api.get(url);
      if (res.data.success) {
        setData(res.data);
        if (res.data.donation) {
          setClaimQuantity(res.data.donation.remainingQuantity);
        }
      }
    } catch (err) {
      console.error('Failed to load matching analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [donationId]);

  const handleRadiusChange = (e) => {
    const val = Number(e.target.value);
    setMaxRadiusOverride(val);
    fetchMatches(val);
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    setClaimError('');
    setClaimLoading(true);

    try {
      const res = await api.post(`/donations/${donationId}/requests`, {
        requestedQuantity: Number(claimQuantity),
        recipientNotes: claimNotes || 'Immediate shelter community intake',
      });

      if (res.data.success) {
        setClaimSuccess('Claim successfully submitted! The food donor has been notified for handover approval.');
        await fetchMatches(maxRadiusOverride);
      }
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-forest-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-stone-600">
          Running feasibility gates & explainable multi-factor scoring...
        </p>
      </div>
    );
  }

  if (!data?.donation) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">Donation Not Found</h2>
        <Link to="/donations" className="text-forest-800 underline text-xs font-bold">
          Return to available donations
        </Link>
      </div>
    );
  }

  const { donation, eligible, ineligible, fallbackAdvice, hasFeasibleMatch } = data;
  const isMyOrgEligible = user?.role === 'recipient' && eligible.some((m) => m.organization._id === organization?._id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* HEADER: DONATION INFO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-forest-700" />
              <span>Intelligent Feasibility Matching Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
              {donation.foodTitle}
            </h1>
            <p className="text-xs text-stone-500">
              Batch #{String(donation._id).slice(-6)} • Category: <strong className="text-stone-800 uppercase">{donation.category.replace(/_/g, ' ')}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <StatusBadge status={donation.status} />
            <Link
              to={`/donations/${donation._id}`}
              className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
            >
              Donation Details
            </Link>
          </div>
        </div>

        {/* PARAMETERS RIBBON */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Remaining Quantity</span>
            <span className="font-extrabold text-stone-900 text-sm">
              {donation.remainingQuantity} of {donation.quantity}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Estimated Servings</span>
            <span className="font-extrabold text-forest-800 text-sm">
              {donation.estimatedServings} Portions
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Collection Deadline</span>
            <span className="font-extrabold text-red-600 text-sm">
              {new Date(donation.collectionWindow.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Pickup Location</span>
            <span className="font-semibold text-stone-700 truncate block">
              {donation.pickupAddress?.formattedAddress}
            </span>
          </div>
        </div>

        {/* RADIUS EXPANSION SLIDER */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-stone-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-forest-700" />
            <span className="font-bold text-stone-800">Dynamic Search Radius Override:</span>
            <span className="px-2 py-0.5 rounded bg-forest-100 text-forest-900 font-black">
              {maxRadiusOverride} km
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={maxRadiusOverride}
              onChange={handleRadiusChange}
              className="w-48 accent-forest-800 cursor-pointer"
            />
            <button
              onClick={() => fetchMatches(maxRadiusOverride)}
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600"
              title="Refresh matches"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* INDIAN PIN-CODE MATCHING SUMMARY BANNER */}
      {data?.pinCodeSummary && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition-all shadow-sm ${
            (data.pinCodeSummary.samePinMatchesCount || data.pinCodeSummary.exactPinMatches) > 0
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : 'bg-amber-50/90 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white shadow-xs border border-stone-200/60 flex items-center justify-center text-lg shrink-0">
              {(data.pinCodeSummary.samePinMatchesCount || data.pinCodeSummary.exactPinMatches) > 0 ? '🎯' : '📍'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm tracking-tight">
                  Indian PIN Code Matching: Area {data.pinCodeSummary.donorPinCode || data.pinCodeSummary.donationPinCode || donation.pinCode || '110001'}
                </span>
                {(data.pinCodeSummary.samePinMatchesCount || data.pinCodeSummary.exactPinMatches) > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-600 text-white uppercase shadow-2xs">
                    {data.pinCodeSummary.samePinMatchesCount || data.pinCodeSummary.exactPinMatches} Same-PIN Match(es)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white uppercase shadow-2xs">
                    Nearby Area Fallback Active
                  </span>
                )}
              </div>
              <p className="text-stone-600 text-xs mt-0.5 leading-relaxed">
                {data.pinCodeSummary.statusMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Nearby Matches</span>
              <span className="font-black text-stone-800 text-sm">
                {data.pinCodeSummary.nearbyPinMatchesCount || data.pinCodeSummary.nearbyPinMatches || 0} Orgs
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CLAIM SUCCESS / ERROR BANNERS */}
      {claimSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{claimSuccess}</span>
          <Link to="/requests" className="underline text-emerald-950 font-black">
            View Claims →
          </Link>
        </div>
      )}

      {claimError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{claimError}</span>
        </div>
      )}

      {/* RECIPIENT CLAIM ACTION FORM (If logged in as verified NGO) */}
      {user?.role === 'recipient' && donation.status === 'AVAILABLE' && (
        <div className="bg-amber-50/70 rounded-3xl p-6 border-2 border-amber-300 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-800" />
              <h2 className="text-base font-extrabold text-amber-950">
                Claim This Surplus Donation for {organization?.name}
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-800">
              Your Daily Intake Remaining: {organization?.maxDailyCapacityServings - (organization?.currentDailyClaimedServings || 0)} servings
            </span>
          </div>

          <form onSubmit={handleClaim} className="flex flex-col sm:flex-row items-end gap-3 text-xs">
            <div className="w-full sm:w-48">
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Portions to Claim
              </label>
              <input
                type="number"
                min={1}
                max={donation.remainingQuantity}
                required
                value={claimQuantity}
                onChange={(e) => setClaimQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-bold text-stone-900"
              />
            </div>

            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Shelter Intake Notes (Optional)
              </label>
              <input
                type="text"
                value={claimNotes}
                onChange={(e) => setClaimNotes(e.target.value)}
                placeholder="e.g. For dinner meal service at Paharganj community shelter"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={claimLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold shadow-md transition-all whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Rescue Claim</span>
            </button>
          </form>
        </div>
      )}

      {/* SECTION 1: ELIGIBLE RECIPIENTS RANKED (0-100) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Eligible Recipient Organizations (Passed All Hard Gates)</span>
            </h2>
            <p className="text-xs text-stone-500">
              Ranked descending by explainable weighted match score (0–100)
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
            {eligible.length} Candidates
          </span>
        </div>

        {eligible.length === 0 ? (
          <div className="bg-stone-50 rounded-3xl p-8 border border-stone-200 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="font-extrabold text-sm text-stone-800">
              No recipient organizations passed the hard feasibility gates
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Expand the search radius slider above or review the ineligible organizations below to inspect gate exclusion reasons.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {eligible.map((cand, idx) => {
              const isExpanded = expandedBreakdown === cand.organization._id;

              return (
                <div
                  key={cand.organization._id}
                  className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden transition-all hover:border-forest-300"
                >
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-forest-800 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <h3 className="font-extrabold text-base text-stone-900">
                          {cand.organization.name}
                        </h3>
                        <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                          {cand.organization.type?.replace(/_/g, ' ')}
                        </span>
                        {cand.pinMatchTier === 'SAME_PIN' ? (
                          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            🎯 Same PIN ({cand.organization.pinCode || cand.organization.address?.pinCode || '110001'})
                          </span>
                        ) : cand.pinMatchTier === 'NEARBY_PIN' ? (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            📍 Nearby PIN ({cand.organization.pinCode || cand.organization.address?.pinCode})
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                            PIN {cand.organization.pinCode || cand.organization.address?.pinCode}
                          </span>
                        )}
                        {cand.organization.hasVehicle && (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Truck className="w-3 h-3" /> Internal Fleet
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
                          <strong>{cand.distanceKm} km</strong> away (~{cand.estimatedTransitMinutes} mins transit)
                        </span>
                        <span>•</span>
                        <span>Capacity: <strong>{cand.organization.remainingCapacity}</strong> servings remaining today</span>
                      </div>

                      {/* Positive Reasons Bullets */}
                      <div className="pt-2 space-y-1">
                        {cand.reasons.map((r, rIdx) => (
                          <p key={rIdx} className="text-xs text-emerald-800 flex items-center gap-1.5 font-medium">
                            <span className="text-emerald-500 font-bold">✓</span> {r}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                      <ScoreBadge score={cand.scores.totalScore} />

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setChatTarget({
                              name: cand.organization.name,
                              phone: cand.organization.contactPhone,
                            });
                            setChatOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                          title="Direct In-Platform Chat & Contact"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Chat</span>
                        </button>

                        <button
                          onClick={() => setExpandedBreakdown(isExpanded ? null : cand.organization._id)}
                          className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide' : 'Formula'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SCORE BREAKDOWN DRAWER */}
                  {isExpanded && (
                    <div className="bg-cream-50 p-6 border-t border-cream-200 space-y-3 animate-in fade-in">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                        Formula Weight Breakdown (0–100 Normalized):
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-stone-200">
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Proximity (25%)</span>
                          <span className="font-extrabold text-stone-800 text-sm">{cand.scores.proximityScore}%</span>
                          <span className="text-[10px] text-stone-400 block">{cand.distanceKm} km</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-stone-200">
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Capacity (20%)</span>
                          <span className="font-extrabold text-stone-800 text-sm">{cand.scores.capacityScore}%</span>
                          <span className="text-[10px] text-stone-400 block">Optimal batch fit</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-stone-200">
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Time Margin (25%)</span>
                          <span className="font-extrabold text-stone-800 text-sm">{cand.scores.timeScore}%</span>
                          <span className="text-[10px] text-stone-400 block">{cand.safetyMarginMinutes} min buffer</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-stone-200">
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Dietary (15%)</span>
                          <span className="font-extrabold text-stone-800 text-sm">{cand.scores.dietaryScore}%</span>
                          <span className="text-[10px] text-stone-400 block">Direct compatibility</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-stone-200">
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Need (10%)</span>
                          <span className="font-extrabold text-stone-800 text-sm">{cand.scores.needScore}%</span>
                          <span className="text-[10px] text-stone-400 block">Community demand</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-stone-200">
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Fleet (5%)</span>
                          <span className="font-extrabold text-stone-800 text-sm">{cand.scores.pickupScore}%</span>
                          <span className="text-[10px] text-stone-400 block">{cand.organization.hasVehicle ? 'Has vehicle' : 'Volunteer reliant'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: INELIGIBLE ORGANIZATIONS & EXPLICIT GATE FAILURES */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span>Ineligible Candidates & Gate Failure Reasons</span>
            </h2>
            <p className="text-xs text-stone-500">
              Excluded prior to scoring to prevent safety failures, intake overflow, or expired transit
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-extrabold text-xs">
            {ineligible.length} Excluded
          </span>
        </div>

        {ineligible.length === 0 ? (
          <div className="p-6 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-400">
            All registered organizations met basic eligibility requirements.
          </div>
        ) : (
          <div className="space-y-3">
            {ineligible.map((item) => (
              <div
                key={item.organization._id}
                className="bg-white rounded-2xl p-5 border border-red-200/80 shadow-2xs space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-stone-800">{item.organization.name}</h3>
                    <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                      {item.organization.type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-stone-500">
                      ({item.distanceKm} km away)
                    </span>
                  </div>

                  <span className="text-[10px] font-black uppercase text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded self-start sm:self-auto">
                    Failed Gate Check
                  </span>
                </div>

                {/* Specific Gate Failure Reasons */}
                <div className="space-y-1 pt-1">
                  {item.gateFailures.map((gf, gIdx) => (
                    <div key={gIdx} className="flex items-start gap-2 text-xs text-red-700">
                      <span className="font-bold font-mono text-[10px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded mt-0.5">
                        {gf.gate}
                      </span>
                      <span>{gf.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: ZERO-MATCH FALLBACK ADVICE */}
      {!hasFeasibleMatch && fallbackAdvice && fallbackAdvice.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500 to-terracotta-600 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-amber-100">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-black text-lg">
              No Feasible Match Found — Engine Fallback Strategy
            </h3>
          </div>
          <p className="text-xs text-amber-50 leading-relaxed">
            All registered organizations within the standard radius failed at least one essential feasibility gate. To prevent edible food from being discarded, FoodLoop suggests:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            {fallbackAdvice.map((a, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20">
                <h4 className="font-bold text-sm text-white mb-1">{a.action}</h4>
                <p className="text-amber-100 leading-relaxed">{a.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IN-PLATFORM CHAT & CONTACT MODAL */}
      <ChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        donationId={donation._id}
        donationTitle={donation.foodTitle}
        contactName={chatTarget.name}
        contactPhone={chatTarget.phone}
      />
    </div>
  );
}
