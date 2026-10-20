import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Building,
  UtensilsCrossed,
} from 'lucide-react';
import { StatusBadge, ScoreBadge } from '../components/Badge';

export default function RequestsManagement() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests/me');
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (reqId) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/requests/${reqId}/accept`);
      if (res.data.success) {
        setMessage('Request approved! A pickup courier mission has been created.');
        await loadRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reqId) => {
    if (!window.confirm('Decline this claim request?')) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/requests/${reqId}/reject`);
      if (res.data.success) {
        setMessage('Request declined. Reserved quantity returned to inventory.');
        await loadRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
            Claims & Requests Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            {user?.role === 'donor' ? 'Incoming Shelter Claim Requests' : 'Your Surplus Rescue Claims'}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {user?.role === 'donor'
              ? 'Approve claims to automatically dispatch volunteer couriers'
              : 'Track donor acceptance and pickup status for your shelter claims'}
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="underline text-emerald-950">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-2">
          <ClipboardList className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-bold text-sm text-stone-700">No requests on record</h3>
          <p className="text-xs text-stone-500">
            {user?.role === 'donor'
              ? 'When community shelters claim your surplus food, they will appear here for one-click approval.'
              : 'Browse available food on the live map to claim surplus for your community kitchen.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    r.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                    r.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                    r.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-stone-100 text-stone-700'
                  }`}>
                    {r.status}
                  </span>
                  <h3 className="font-extrabold text-sm text-stone-900">
                    {r.donation?.foodTitle}
                  </h3>
                  {r.matchScoreSnapshot?.totalScore > 0 && (
                    <ScoreBadge score={r.matchScoreSnapshot.totalScore} />
                  )}
                </div>

                <p className="text-xs text-stone-600">
                  {user?.role === 'donor' ? (
                    <>Claimed by: <strong>{r.recipientOrg?.name}</strong> ({r.recipientOrg?.type})</>
                  ) : (
                    <>Donor: <strong>{r.donation?.donorOrg?.name || 'Commercial Donor'}</strong></>
                  )}
                  {' • '}
                  Quantity: <strong>{r.requestedQuantity} {r.donation?.unit}</strong> ({r.requestedServings} estimated servings)
                </p>

                {r.recipientNotes && (
                  <p className="text-xs text-stone-500 italic bg-stone-50 p-2 rounded-xl">
                    "{r.recipientNotes}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {user?.role === 'donor' && r.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleReject(r._id)}
                      disabled={actionLoading}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(r._id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Claim</span>
                    </button>
                  </>
                )}

                <Link
                  to={`/donations/${r.donation?._id}`}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
                >
                  View Food
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
