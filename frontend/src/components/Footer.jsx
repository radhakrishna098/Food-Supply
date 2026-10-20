import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Shield, Heart, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-forest-700 flex items-center justify-center text-white">
                <UtensilsCrossed className="w-4 h-4 text-forest-300" />
              </div>
              <span className="font-bold text-lg text-white">
                Food<span className="text-terracotta-400">Loop</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed mb-4">
              "Rescue Surplus. Deliver Hope." Connecting commercial surplus food with verified community shelters before collection windows close.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
              <Shield className="w-3.5 h-3.5 text-forest-400" />
              <span>Feasibility-First Matching & Safe Handover</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How FoodLoop Works</Link></li>
              <li><Link to="/impact" className="hover:text-white transition-colors">Measurable Impact Analytics</Link></li>
              <li><Link to="/donations" className="hover:text-white transition-colors">Live Surplus Food Map</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Role Login Portal</Link></li>
            </ul>
          </div>

          {/* Community Roles */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-3">Community Network</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-stone-400">Food Donors:</span> Restaurants & Bakeries</li>
              <li><span className="text-stone-400">Recipients:</span> Verified Shelters & Pantries</li>
              <li><span className="text-stone-400">Volunteers:</span> Express Handover Couriers</li>
              <li><span className="text-stone-400">Auditors:</span> Platform Admin Governance</li>
            </ul>
          </div>

          {/* Transparency & Standards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-3">Impact Methodology</h4>
            <p className="text-xs text-stone-400 leading-relaxed mb-2">
              All environmental and meal equivalents are calculated strictly from verified, completed deliveries in accordance with UN FAO benchmarks (~0.85 kg CO2e per meal portion).
            </p>
            <p className="text-[11px] text-stone-500">
              Deterministic, explainable scoring. No fabricated testimonials or unverified statistics.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} FoodLoop — Intelligent Surplus Food Rescue Network. Open and auditable.</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-500 fill-red-500" /> Community Powered
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-forest-400" /> OpenStreetMap Powered
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
