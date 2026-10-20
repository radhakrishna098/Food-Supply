import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCheck, Clock } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
            Inbox & Alerts
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Platform Notifications
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time alerts regarding donation matches, claim approvals, and courier status updates
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAsRead('all')}
            className="px-4 py-2 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-xs border border-forest-200 transition-colors flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">No notifications on record.</div>
        ) : (
          <div className="divide-y divide-stone-100 text-xs">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => markAsRead(n._id)}
                className={`p-5 transition-colors cursor-pointer hover:bg-stone-50 ${
                  !n.read ? 'bg-cream-50 font-medium' : 'text-stone-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-stone-900">{n.title}</span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-terracotta-500"></span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
