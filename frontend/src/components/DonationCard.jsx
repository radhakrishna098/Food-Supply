import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Package, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { StatusBadge, CategoryBadge, DietaryBadge } from './Badge';

export default function DonationCard({ donation, showActions = true }) {
  const deadline = new Date(donation.collectionWindow?.deadline);
  const now = new Date();
  const diffHours = (deadline - now) / (1000 * 60 * 60);
  const isUrgent = diffHours > 0 && diffHours < 2;
  const isExpired = diffHours <= 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
      {/* Top Banner / Image */}
      <div className="relative h-44 w-full bg-cream-200 overflow-hidden">
        {donation.imageUrl ? (
          <img
            src={donation.imageUrl}
            alt={donation.foodTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-forest-800 to-forest-900 text-white p-4">
            <Package className="w-10 h-10 text-forest-300 mb-1" />
            <span className="text-xs font-semibold tracking-wider uppercase text-forest-200">Surplus Food Rescue</span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <StatusBadge status={donation.status} />
          <CategoryBadge category={donation.category} />
          {donation.pinCode && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-forest-900/90 text-forest-100 backdrop-blur-xs shadow-xs">
              PIN {donation.pinCode}
            </span>
          )}
        </div>

        {isUrgent && !isExpired && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow flex items-center gap-1 animate-pulse">
            <AlertCircle className="w-3 h-3" /> Urgent Collection
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex flex-wrap gap-1">
            {donation.dietaryClassification?.map((d) => (
              <DietaryBadge key={d} dietary={d} />
            ))}
          </div>
          {donation.donorType && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
              {donation.donorType.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        <h3 className="font-bold text-base text-stone-900 group-hover:text-forest-800 transition-colors line-clamp-1 mb-1">
          {donation.foodTitle}
        </h3>

        <p className="text-xs text-stone-600 line-clamp-2 mb-4 leading-relaxed">
          {donation.description || 'Nutritious surplus food packaged in safe food-grade containers.'}
        </p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-cream-50 border border-cream-200/60 mb-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Available</span>
            <span className="font-extrabold text-stone-800 text-sm">
              {donation.remainingQuantity} <span className="font-medium text-xs text-stone-500">{donation.unit}</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Feeds Approx.</span>
            <span className="font-extrabold text-forest-800 text-sm">
              {donation.estimatedServings} <span className="font-medium text-xs text-stone-500">people</span>
            </span>
          </div>
        </div>

        {/* Footer info: Location & Deadline */}
        <div className="mt-auto pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-500">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
            <span className="truncate">{donation.pickupAddress?.formattedAddress}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 shrink-0 ${isUrgent ? 'text-red-500 font-bold' : 'text-stone-400'}`} />
              <span className={isUrgent ? 'text-red-600 font-semibold' : ''}>
                {isExpired ? 'Window Closed' : `By ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safety Verified</span>
            </div>
          </div>
        </div>

        {/* Action Link */}
        {showActions && (
          <div className="mt-4 pt-2">
            <Link
              to={`/donations/${donation._id}`}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs transition-all shadow-sm group-hover:shadow"
            >
              <span>View Details & Match Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
