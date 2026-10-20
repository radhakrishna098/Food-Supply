import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  Lock,
  Truck,
  Building,
  UtensilsCrossed,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export default function HowItWorks() {
  const gates = [
    { name: 'Admin Verification Gate', desc: 'Organization must possess verified NGO / charitable entity credentials. Unverified accounts cannot claim donations.' },
    { name: 'Active Operating Hours', desc: 'Organization must be actively accepting donations today and open during the donor collection window.' },
    { name: 'Food Category Match', desc: 'Organization must explicitly accept the donation category (e.g. prepared meals, refrigerated dairy, bakery).' },
    { name: 'Dietary Compatibility', desc: 'Strict dietary enforcement. Non-vegetarian items are never routed to strictly vegetarian or vegan shelters.' },
    { name: 'Intake Capacity Fit', desc: 'Donation portion size must fit within the organization’s remaining daily intake threshold without causing spillage.' },
    { name: 'Service Radius Boundary', desc: 'Travel distance must not exceed recipient organization or volunteer courier operating radius.' },
    { name: 'Deadline & Transit Feasibility', desc: 'Calculated travel time plus preparation buffer must fit safely inside the donor collection window.' },
  ];

  const scoringWeights = [
    { factor: 'Geographic Proximity', weight: '25%', detail: 'Calculated using spherical Haversine formula. 0 km scores 100%, scaling down to 0% at boundary radius.' },
    { factor: 'Collection Time Feasibility & Safety Buffer', weight: '25%', detail: 'Safety margin = (Deadline - Transit time). Buffer > 3 hrs scores 100%; tight margins receive urgency flags.' },
    { factor: 'Quantity & Capacity Fit', weight: '20%', detail: 'Optimal fit when donation utilizes 50%–90% of recipient capacity without overwhelming kitchen capacity.' },
    { factor: 'Dietary & Category Specificity', weight: '15%', detail: 'Direct match with specific institutional preferences (e.g. daily soup kitchen hot meals).' },
    { factor: 'Recipient Need & Community Demand', weight: '10%', detail: 'Organizations with lower received intake today or urgent community pantry demands receive higher priority.' },
    { factor: 'Pickup Readiness & Transport Logistics', weight: '5%', detail: 'Organizations with self-pickup transport vehicles receive an operational dispatch bonus.' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* HEADER */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" /> Technical Specification
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          How FoodLoop Coordinates Surplus Rescue
        </h1>
        <p className="text-stone-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          FoodLoop replaces arbitrary bulletin boards with an automated, explainable, feasibility-first matching engine and tamper-evident handover verification.
        </p>
      </div>

      {/* 5-STAGE LIFECYCLE */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-10 space-y-8">
        <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-forest-800" />
          The 5-Stage Rescue Lifecycle
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-forest-800 text-white font-bold flex items-center justify-center mb-2">1</span>
              <h4 className="font-bold text-stone-900 text-sm mb-1">Surplus Declaration</h4>
              <p className="text-stone-600 leading-relaxed">
                Donor specifies food category, portion counts, allergens, preparation timestamp, and collection deadline with mandatory safety affirmations.
              </p>
            </div>
            <span className="mt-4 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              AVAILABLE
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-forest-800 text-white font-bold flex items-center justify-center mb-2">2</span>
              <h4 className="font-bold text-stone-900 text-sm mb-1">Gate Filtering & Ranking</h4>
              <p className="text-stone-600 leading-relaxed">
                Engine excludes ineligible NGOs (capacity, radius, dietary). Eligible candidates are scored 0–100 with clear explainability reasons.
              </p>
            </div>
            <span className="mt-4 text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              MATCH ENGINE
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-forest-800 text-white font-bold flex items-center justify-center mb-2">3</span>
              <h4 className="font-bold text-stone-900 text-sm mb-1">Atomic Claim & Reservation</h4>
              <p className="text-stone-600 leading-relaxed">
                Verified NGO claims portions. Database executes conditional update preventing race conditions and reserves intake capacity.
              </p>
            </div>
            <span className="mt-4 text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              REQUESTED
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-forest-800 text-white font-bold flex items-center justify-center mb-2">4</span>
              <h4 className="font-bold text-stone-900 text-sm mb-1">Courier Task Dispatch</h4>
              <p className="text-stone-600 leading-relaxed">
                Donor approves claim. Task board dispatches volunteer courier. Dual cryptographic 6-digit OTP codes generated.
              </p>
            </div>
            <span className="mt-4 text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              PICKUP ASSIGNED
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-forest-800 text-white font-bold flex items-center justify-center mb-2">5</span>
              <h4 className="font-bold text-stone-900 text-sm mb-1">Verified Delivery Handover</h4>
              <p className="text-stone-600 leading-relaxed">
                Courier verifies Donor OTP at pickup and NGO OTP at delivery. State transitions to DELIVERED; impact metrics update.
              </p>
            </div>
            <span className="mt-4 text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              DELIVERED
            </span>
          </div>
        </div>
      </div>

      {/* PHASE 1: HARD ELIGIBILITY GATES */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-10 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-4 h-4" /> Phase 1: Mandatory Filtering
          </span>
          <h2 className="text-2xl font-extrabold text-stone-900">
            The 7 Hard Eligibility Gates
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Before calculating ranking scores, candidates must pass every mandatory feasibility gate. A high score cannot override a safety failure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gates.map((g, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <h4 className="font-bold text-stone-900 text-sm">{g.name}</h4>
              </div>
              <p className="text-stone-600 leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PHASE 2: EXPLAINABLE MULTI-FACTOR WEIGHTING */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-10 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700 flex items-center gap-1.5 mb-1">
            <Compass className="w-4 h-4" /> Phase 2: Explainable Scoring
          </span>
          <h2 className="text-2xl font-extrabold text-stone-900">
            Explainable Multi-Factor Scoring (0–100 Normalized)
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Eligible candidates are ranked by an explainable formula. Every recommendation includes positive reasoning and cautionary warnings.
          </p>
        </div>

        <div className="divide-y divide-stone-100">
          {scoringWeights.map((w, idx) => (
            <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="max-w-lg">
                <h4 className="font-bold text-stone-900 text-sm mb-0.5">{w.factor}</h4>
                <p className="text-stone-600 leading-relaxed">{w.detail}</p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-forest-100 text-forest-900 font-black text-sm self-start sm:self-auto">
                {w.weight}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DUAL OTP HANDOVER SECURITY */}
      <div className="bg-forest-900 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden space-y-6">
        <div className="flex items-center gap-2 text-forest-300 text-xs font-bold uppercase tracking-wider">
          <Lock className="w-4 h-4" /> Fraud-Proof Verification Protocol
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold">
          Dual Cryptographic 6-Digit OTP Handover
        </h2>
        <p className="text-xs sm:text-sm text-forest-200 max-w-2xl leading-relaxed">
          To prevent false delivery confirmations, FoodLoop generates two independent 6-digit verification codes using cryptographic SHA-256 hashing.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-4 rounded-2xl bg-forest-800/80 border border-forest-700">
            <h4 className="font-bold text-sm text-white mb-1">Pickup Verification OTP</h4>
            <p className="text-forest-200 leading-relaxed mb-2">
              Provided solely to the Food Donor. When the volunteer arrives, the donor inspects their badge and supplies the 6-digit OTP to authorize collection.
            </p>
            <span className="text-[10px] bg-forest-950 text-forest-300 px-2 py-0.5 rounded font-mono">
              Transitions to: COLLECTED
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-forest-800/80 border border-forest-700">
            <h4 className="font-bold text-sm text-white mb-1">Delivery Verification OTP</h4>
            <p className="text-forest-200 leading-relaxed mb-2">
              Provided solely to the Recipient NGO. When the food safely arrives, the shelter representative inspects the containers and gives the delivery OTP to complete the mission.
            </p>
            <span className="text-[10px] bg-forest-950 text-forest-300 px-2 py-0.5 rounded font-mono">
              Transitions to: DELIVERED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
