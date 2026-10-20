import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, History, Package, ShieldCheck } from 'lucide-react';
import { StatusBadge, CategoryBadge } from '../components/Badge';

export default function DonationHistory() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        if (user?.role === 'donor') {
          const res = await api.get('/donations?myDonations=true');
          if (res.data.success) setItems(res.data.donations);
        } else {
          const res = await api.get('/pickups');
          if (res.data.success) setItems(res.data.pickups);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
          Rescue Records Archive
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
          Donation & Mission History
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Historical log of surplus food postings, custody handovers, and verified community deliveries
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400">Loading history archive...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
          <History className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-stone-700">No history records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
          <div className="divide-y divide-stone-100">
            {items.map((item) => {
              const donation = user?.role === 'donor' ? item : item.donation;
              const status = item.status;
              const date = item.createdAt;

              return (
                <div key={item._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={status} />
                      {donation?.category && <CategoryBadge category={donation.category} />}
                      <h4 className="font-bold text-sm text-stone-900">{donation?.foodTitle || 'Surplus Food'}</h4>
                    </div>
                    <p className="text-xs text-stone-600">
                      Quantity: <strong>{donation?.quantity} {donation?.unit}</strong> ({donation?.estimatedServings} servings)
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Recorded: {new Date(date).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {donation?._id && (
                      <Link
                        to={`/donations/${donation._id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
                      >
                        Details
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
