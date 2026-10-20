import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'forest', trend }) {
  const colorMap = {
    forest: 'bg-forest-50 text-forest-800 border-forest-100',
    terracotta: 'bg-terracotta-50 text-terracotta-800 border-terracotta-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    blue: 'bg-blue-50 text-blue-800 border-blue-100',
    purple: 'bg-purple-50 text-purple-800 border-purple-100',
  };

  const iconColorMap = {
    forest: 'bg-forest-800 text-white',
    terracotta: 'bg-terracotta-500 text-white',
    amber: 'bg-amber-500 text-white',
    blue: 'bg-blue-600 text-white',
    purple: 'bg-purple-600 text-white',
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColorMap[color] || 'bg-forest-800 text-white'} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-stone-900 tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600">
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-stone-500 mt-1">{subtitle}</p>}
    </div>
  );
}
