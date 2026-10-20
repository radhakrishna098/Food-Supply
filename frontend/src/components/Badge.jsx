import React from 'react';

export function StatusBadge({ status }) {
  const statusConfig = {
    AVAILABLE: { label: 'Available', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    REQUESTED: { label: 'Claim Requested', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
    ACCEPTED: { label: 'Accepted by Donor', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
    PICKUP_SCHEDULED: { label: 'Courier Scheduled', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    EN_ROUTE: { label: 'Courier En Route', bg: 'bg-sky-100 text-sky-800 border-sky-200' },
    ARRIVED_AT_DONOR: { label: 'At Donor Site', bg: 'bg-violet-100 text-violet-800 border-violet-200' },
    COLLECTED: { label: 'Collected / In Transit', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
    ARRIVED_AT_RECIPIENT: { label: 'Arrived at Recipient', bg: 'bg-teal-100 text-teal-800 border-teal-200' },
    DELIVERED: { label: 'Delivered & Confirmed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' },
    PARTIALLY_CLAIMED: { label: 'Partially Claimed', bg: 'bg-orange-100 text-orange-800 border-orange-200' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-stone-100 text-stone-600 border-stone-200' },
    EXPIRED: { label: 'Window Expired', bg: 'bg-red-100 text-red-700 border-red-200' },
    DISPUTED: { label: 'Disputed', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
  };

  const config = statusConfig[status] || { label: status, bg: 'bg-stone-100 text-stone-700 border-stone-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {config.label}
    </span>
  );
}

export function CategoryBadge({ category }) {
  const categoryLabels = {
    prepared_meals: 'Prepared Meals',
    packaged_groceries: 'Packaged Food',
    fruits_vegetables: 'Fruits & Veggies',
    bakery: 'Bakery Assortment',
    dairy_refrigerated: 'Dairy & Chilled',
    beverages: 'Beverages',
    canned_goods: 'Canned Goods',
    frozen: 'Frozen Food',
  };

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-forest-50 text-forest-800 border border-forest-200">
      {categoryLabels[category] || category}
    </span>
  );
}

export function DietaryBadge({ dietary }) {
  const isVeg = dietary === 'vegetarian' || dietary === 'vegan';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
        isVeg
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-stone-50 text-stone-700 border-stone-200'
      }`}
    >
      {dietary.replace(/_/g, ' ')}
    </span>
  );
}

export function ScoreBadge({ score }) {
  let color = 'bg-stone-100 text-stone-800 border-stone-200';
  if (score >= 85) color = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
  else if (score >= 70) color = 'bg-blue-100 text-blue-800 border-blue-300';
  else if (score >= 50) color = 'bg-amber-100 text-amber-800 border-amber-300';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs border shadow-sm ${color}`}>
      {score}% Match
    </span>
  );
}
