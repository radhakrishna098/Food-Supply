import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { ShieldCheck, Search, Filter, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [entityType, setEntityType] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const url = entityType ? `/admin/audit-logs?entityType=${entityType}&limit=100` : '/admin/audit-logs?limit=100';
      const res = await api.get(url);
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [entityType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
            Immutable Audit Trail
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Platform Audit & Security Logs
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Permanent, tamper-evident log of all entity state mutations, verification reviews, and handover OTP checks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white"
          >
            <option value="">All Entity Types</option>
            <option value="Donation">Donation Records</option>
            <option value="Pickup">Pickup & Handover</option>
            <option value="Organization">Organization / Verification</option>
            <option value="DonationRequest">Claims & Requests</option>
            <option value="User">User Accounts</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading audit log stream...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">No audit records match criteria.</div>
        ) : (
          <div className="divide-y divide-stone-100 font-mono text-xs">
            {logs.map((log) => {
              const isExpanded = expandedLog === log._id;

              return (
                <div key={log._id} className="p-4 hover:bg-stone-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                          {log.action}
                        </span>
                        <span className="font-sans font-semibold text-stone-800">
                          {log.entityType} #{String(log.entityId).slice(-6)}
                        </span>
                        <span className="text-[11px] font-sans text-stone-400">
                          by <strong>{log.actorName}</strong> ({log.actorRole})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto font-sans text-xs">
                      <span className="text-stone-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <button
                        onClick={() => setExpandedLog(isExpanded ? null : log._id)}
                        className="text-stone-500 hover:text-stone-900 font-semibold flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide Payload' : 'Inspect'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 p-3 bg-stone-900 text-stone-200 rounded-xl text-[11px] overflow-x-auto space-y-2">
                      {log.previousState && (
                        <div>
                          <span className="text-stone-400 block font-bold uppercase text-[9px]">Previous State:</span>
                          <pre>{JSON.stringify(log.previousState, null, 2)}</pre>
                        </div>
                      )}
                      {log.newState && (
                        <div>
                          <span className="text-emerald-400 block font-bold uppercase text-[9px]">New State:</span>
                          <pre>{JSON.stringify(log.newState, null, 2)}</pre>
                        </div>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <span className="text-purple-400 block font-bold uppercase text-[9px]">Metadata:</span>
                          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
