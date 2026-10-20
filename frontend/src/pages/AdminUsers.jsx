import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Shield, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const url = roleFilter ? `/admin/users?role=${roleFilter}` : '/admin/users';
      const res = await api.get(url);
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      setActionLoading(true);
      const res = await api.patch(`/admin/users/${userId}/status`, { accountStatus: nextStatus });
      if (res.data.success) {
        await loadUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
            User Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Platform Accounts & Role Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Directory of registered food donors, recipient shelters, and courier volunteers
          </p>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white self-start sm:self-auto"
        >
          <option value="">All Roles ({users.length})</option>
          <option value="donor">Donors</option>
          <option value="recipient">Recipient NGOs</option>
          <option value="volunteer">Volunteer Couriers</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading user directory...</div>
        ) : (
          <div className="divide-y divide-stone-100 text-xs">
            {users.map((u) => (
              <div key={u._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{u.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700">
                      {u.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.accountStatus === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.accountStatus === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.accountStatus}
                    </span>
                  </div>
                  <p className="text-stone-500 text-xs">
                    {u.email} • Phone: {u.phone || 'N/A'} • Joined: {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {u.role !== 'admin' && (
                  <button
                    onClick={() => handleToggleStatus(u._id, u.accountStatus)}
                    disabled={actionLoading}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors self-start sm:self-auto ${
                      u.accountStatus === 'active'
                        ? 'bg-red-50 hover:bg-red-100 text-red-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {u.accountStatus === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
