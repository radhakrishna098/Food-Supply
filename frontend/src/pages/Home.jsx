import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  UtensilsCrossed,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle,
  Truck,
  Building,
  HeartHandshake,
  BarChart3,
  Layers,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import DonationCard from '../components/DonationCard';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [featuredDonations, setFeaturedDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, donationsRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/donations?claimableOnly=true'),
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (donationsRes.data.success) {
          setFeaturedDonations(donationsRes.data.donations.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-cream-200/70 via-cream-100 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-100/80 border border-forest-200 text-forest-800 text-xs font-semibold shadow-sm">
              <Sparkles className="w-4 h-4 text-forest-600" />
              <span>Intelligent Surplus Food Rescue Network</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-forest-950 leading-tight">
              Rescue Surplus. <br />
              <span className="text-terracotta-500">Deliver Hope.</span>
            </h1>

            <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
              Connect surplus food from commercial kitchens with verified community organizations
              before collection windows close. Powered by a feasibility-first, deadline-aware matching engine.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to="/donations"
                className="px-6 py-3.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 group"
              >
                <span>Browse Live Food Map</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/how-it-works"
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-cream-50 text-stone-800 border border-stone-300 font-semibold text-sm shadow-sm transition-all"
              >
                How Matching Engine Works
              </Link>
            </div>
          </div>

          {/* REAL DATABASE-DRIVEN IMPACT STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto">
            <StatCard
              title="Portions Rescued"
              value={stats ? stats.totalServingsRescued : '...'}
              subtitle="Verified delivered meals"
              icon={UtensilsCrossed}
              color="forest"
            />
            <StatCard
              title="Verified NGOs"
              value={stats ? stats.verifiedNgoCount : '...'}
              subtitle="Shelters & pantries"
              icon={Building}
              color="terracotta"
            />
            <StatCard
              title="Active Surplus"
              value={stats ? stats.activeDonations : '...'}
              subtitle="Awaiting pickup"
              icon={Clock}
              color="amber"
            />
            <StatCard
              title="CO₂e Avoided"
              value={stats ? `${stats.estimatedCo2KgAvoided} kg` : '...'}
              subtitle="Estimated emissions saved"
              icon={ShieldCheck}
              color="blue"
            />
          </div>
        </div>
      </section>

      {/* CORE INNOVATION: FEASIBILITY-FIRST MATCHING ENGINE SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-md p-8 md:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-800 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" /> Core Algorithmic Innovation
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 leading-tight">
                Why Traditional Food Donation Coordination Fails — And How FoodLoop Solves It
              </h2>

              <p className="text-sm text-stone-600 leading-relaxed">
                Traditional donation apps rely on simple distance sorting or bulletin boards. Donors wait hours for replies, while NGOs receive donations they cannot store or legally serve. FoodLoop introduces a <strong>two-phase decision engine</strong>:
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Hard Eligibility Gates</h4>
                    <p className="text-xs text-stone-600">
                      Strictly filters out recipients who lack daily intake capacity, exceed service radius, violate dietary rules (e.g. non-veg to vegetarian shelters), or lack admin verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Explainable Multi-Factor Scoring (0–100)</h4>
                    <p className="text-xs text-stone-600">
                      Ranks candidates by Proximity (25%), Quantity/Capacity fit (20%), Transit vs. Deadline Feasibility (25%), Dietary overlap (15%), Community Need (10%), and Fleet availability (5%).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Zero-Match Fallbacks & Double OTP Security</h4>
                    <p className="text-xs text-stone-600">
                      Provides intelligent suggestions when no local match exists and enforces dual cryptographically verified OTP handovers at donor collection and NGO delivery.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-800 hover:text-forest-900 underline"
                >
                  Read the complete mathematical matching specification →
                </Link>
              </div>
            </div>

            {/* Visual Flow / Decision Diagram Box */}
            <div className="bg-cream-100/90 rounded-2xl p-6 border border-stone-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-forest-700" />
                Live Matching Decision Architecture
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-bold text-stone-800">Donor Posts Surplus</p>
                    <p className="text-[11px] text-stone-500">50 portions vegetarian meals • 4 hr window</p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Step 1</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-stone-800">Phase 1: Hard Gate Evaluation</p>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Strict</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <p className="text-emerald-700">✓ Hope Shelter: Verified, 120 cap, 1.5 km (PASS)</p>
                    <p className="text-red-600">✗ Eastside Pantry: Pending verification (FAIL)</p>
                    <p className="text-red-600">✗ Sunrise Haven: Cap 8 &lt; 50 needed (FAIL)</p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-bold text-stone-800">Phase 2: Multi-Factor Scoring</p>
                    <p className="text-[11px] text-stone-500">Hope Shelter: 92% Match • Delhi Central Bank: 84%</p>
                  </div>
                  <span className="text-[10px] bg-forest-100 text-forest-800 px-2 py-0.5 rounded-full font-semibold">Ranked</span>
                </div>

                <div className="p-3 bg-forest-800 text-white rounded-xl shadow flex items-center justify-between">
                  <div>
                    <p className="font-bold">Automated Courier Dispatch</p>
                    <p className="text-[11px] text-forest-200">Dual 6-digit OTP verification at collection & delivery</p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-forest-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED LIVE DONATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-terracotta-600 mb-1">
              <Clock className="w-3.5 h-3.5" /> Urgent Time Windows
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Live Surplus Food Opportunities
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Actively available surplus batches awaiting claim and courier dispatch.
            </p>
          </div>

          <Link
            to="/donations"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-800 hover:text-forest-900 underline self-start sm:self-auto"
          >
            <span>View All Active Donations on Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {featuredDonations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
            <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-stone-700">No active surplus donations at this exact moment</h3>
            <p className="text-xs text-stone-500 mt-1">Check back shortly or log in as a donor to post surplus food.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDonations.map((donation) => (
              <DonationCard key={donation._id} donation={donation} />
            ))}
          </div>
        )}
      </section>

      {/* THREE COMMUNITY PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Engineered for Every Stakeholder
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2">
            Server-enforced role access ensures seamless coordination between commercial donors, verified recipient charities, and volunteer couriers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-2">Food Donors</h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Restaurants, caterers, hotels, and bakeries. Post surplus in 60 seconds with strict safety declarations, track claims, and receive collection confirmation.
            </p>
            <ul className="text-xs text-stone-600 space-y-1.5 mb-6">
              <li className="flex items-center gap-1.5">✓ Ranked recipient recommendations</li>
              <li className="flex items-center gap-1.5">✓ One-click request acceptance</li>
              <li className="flex items-center gap-1.5">✓ Secure 6-digit courier verification OTP</li>
            </ul>
            <Link
              to="/donations/create"
              className="mt-auto py-2 text-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors"
            >
              Post Food Surplus
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-2">Verified Recipient NGOs</h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Shelters, community kitchens, and food banks. Configure intake capacity, dietary requirements, and claim matching donations on an interactive map.
            </p>
            <ul className="text-xs text-stone-600 space-y-1.5 mb-6">
              <li className="flex items-center gap-1.5">✓ Feasibility match score explainability</li>
              <li className="flex items-center gap-1.5">✓ Atomic quantity claims (no race conditions)</li>
              <li className="flex items-center gap-1.5">✓ Delivery handover verification OTP</li>
            </ul>
            <Link
              to="/donations"
              className="mt-auto py-2 text-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors"
            >
              Browse Eligible Food
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-2">Volunteer Couriers</h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Community members bridging transit gaps. Accept urgent rescue tasks, navigate between donor and recipient, and verify handovers securely.
            </p>
            <ul className="text-xs text-stone-600 space-y-1.5 mb-6">
              <li className="flex items-center gap-1.5">✓ Real-time task board with route estimates</li>
              <li className="flex items-center gap-1.5">✓ Step-by-step handover state machine</li>
              <li className="flex items-center gap-1.5">✓ Volunteer impact contribution metrics</li>
            </ul>
            <Link
              to="/pickups"
              className="mt-auto py-2 text-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors"
            >
              View Volunteer Tasks
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
