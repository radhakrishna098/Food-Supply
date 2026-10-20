import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Building,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Clock,
  ArrowRight,
  Package,
  KeyRound,
  Truck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { StatusBadge, CategoryBadge, ScoreBadge } from '../components/Badge';

export default function NgoDashboard() {
  const { user, organization, refreshUser } = useAuth();
  const [availableDonations, setAvailableDonations] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [donationsRes, claimsRes, pickupsRes] = await Promise.all([
        api.get('/donations?claimableOnly=true'),
        api.get('/requests/me'),
        api.get('/pickups'),
      ]);

      if (donationsRes.data.success) setAvailableDonations(donationsRes.data.donations);
      if (claimsRes.data.success) setMyClaims(claimsRes.data.requests);
      if (pickupsRes.data.success) setPickups(pickupsRes.data.pickups);
    } catch (err) {
      console.error('Failed to load NGO dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isVerified = organization?.verificationStatus === 'verified';
  const remainingCapacity = organization
    ? Math.max(0, organization.maxDailyCapacityServings - (organization.currentDailyClaimedServings || 0))
    : 0;
  const capacityPct = organization
    ? Math.min(100, Math.round(((organization.currentDailyClaimedServings || 0) / organization.maxDailyCapacityServings) * 100))
    : 0;

  const activeIncomingPickups = pickups.filter(
    (p) => p.status !== 'DELIVERED' && p.status !== 'CANCELLED'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Recipient Organization Portal
            </span>
            {isVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> Verified Partner
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                <ShieldAlert className="w-3 h-3" /> Pending Verification
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            {organization?.name || user.name}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {organization?.address?.formattedAddress || 'Paharganj, New Delhi'} • Operating Hours: {organization?.operatingHours?.open || '08:00'} - {organization?.operatingHours?.close || '21:00'}
          </p>
        </div>

        <Link
          to="/donations"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-forest-300" />
          <span>Browse Available Surplus</span>
        </Link>
      </div>

      {/* UNVERIFIED ONBOARDING WARNING (If pending) */}
      {!isVerified && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-base text-amber-950">
                Verification Application Pending Review
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                To safeguard community health, FoodLoop requires administrator validation of registration documents and food safety storage capacity before surplus food claims can be executed.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Link
                  to="/profile"
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  View / Upload Documentation
                </Link>
                <span className="text-xs text-amber-700 font-medium">
                  Status: <strong>{organization?.verificationStatus || 'pending'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATS & INTAKE CAPACITY GAUGE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Capacity Meter */}
        <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Daily Kitchen Intake Capacity
            </span>
            <span className="text-xs font-black text-forest-800">
              {organization?.currentDailyClaimedServings || 0} / {organization?.maxDailyCapacityServings || 100} Servings
            </span>
          </div>

          <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacityPct > 85 ? 'bg-amber-500' : 'bg-forest-700'
              }`}
              style={{ width: `${capacityPct}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Remaining today: <strong>{remainingCapacity} servings</strong></span>
            <span>Intake utilization: {capacityPct}%</span>
          </div>
        </div>

        <StatCard
          title="Active Missions"
          value={activeIncomingPickups.length}
          subtitle="Food deliveries en route"
          icon={Truck}
          color="blue"
        />

        <StatCard
          title="Surplus in Region"
          value={availableDonations.length}
          subtitle="Available for claiming"
          icon={Package}
          color="terracotta"
        />
      </div>

      {/* ACTIVE INCOMING DELIVERIES & DELIVERY OTP */}
      {activeIncomingPickups.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-lg text-stone-900">
                Incoming Deliveries & Delivery Verification OTP
              </h2>
              <p className="text-xs text-stone-500">
                Provide this 6-digit delivery code to the volunteer courier when they arrive at your shelter
              </p>
            </div>
            <Truck className="w-5 h-5 text-forest-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeIncomingPickups.map((p) => (
              <div
                key={p._id}
                className="p-5 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <StatusBadge status={p.status} />
                    <h3 className="font-bold text-sm text-stone-900 mt-2">{p.donation?.foodTitle}</h3>
                    <p className="text-xs text-stone-600">
                      Origin: <strong>{p.donor?.name}</strong>
                    </p>
                  </div>

                  {/* Recipient's Delivery Code */}
                  <div className="bg-white px-3 py-2 rounded-xl border-2 border-terracotta-500 shadow-sm text-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                      Delivery OTP
                    </span>
                    <span className="font-mono text-base font-extrabold text-terracotta-600 tracking-wider">
                      {p.deliveryCode || '••••••'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                  <span>Courier: {p.assignedVolunteer?.name || 'Awaiting volunteer'}</span>
                  <Link
                    to={`/pickups/${p._id}`}
                    className="text-forest-800 font-bold hover:underline"
                  >
                    Track Progress →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP MATCHING SURPLUS IN REGION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-lg text-stone-900">
              Surplus Food Available in Your Area
            </h2>
            <p className="text-xs text-stone-500">
              Matching engine filters donations based on dietary preferences and daily kitchen capacity
            </p>
          </div>

          <Link
            to="/donations"
            className="text-xs font-bold text-forest-800 hover:text-forest-900 underline"
          >
            Open Interactive Map →
          </Link>
        </div>

        {availableDonations.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            No active surplus donations in your service radius at this moment. You will be alerted when new donations are posted.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {availableDonations.slice(0, 5).map((d) => (
              <div key={d._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={d.category} />
                    <h3 className="font-bold text-sm text-stone-900">{d.foodTitle}</h3>
                  </div>
                  <p className="text-xs text-stone-600">
                    Quantity: <strong>{d.remainingQuantity} {d.unit}</strong> ({d.estimatedServings} servings)
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Deadline: {new Date(d.collectionWindow.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-terracotta-500" />
                      {d.pickupAddress?.formattedAddress}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    to={`/donations/${d._id}`}
                    className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <span>Claim Surplus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
