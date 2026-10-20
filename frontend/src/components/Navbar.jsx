import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  UtensilsCrossed,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  Truck,
  HeartHandshake,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  MapPin,
  ClipboardList,
} from 'lucide-react';

export default function Navbar() {
  const { user, organization, logout, login } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleQuickLogin = async (email) => {
    try {
      await login(email, 'Password123!');
      setShowDemoMenu(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Quick switch failed', err);
    }
  };

  const navLinks = [
    { label: 'How It Works', path: '/how-it-works', public: true },
    { label: 'Impact', path: '/impact', public: true },
    { label: 'Live Food Map', path: '/donations', public: true },
  ];

  const roleBadgeColors = {
    donor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    recipient: 'bg-amber-100 text-amber-800 border-amber-200',
    volunteer: 'bg-blue-100 text-blue-800 border-blue-200',
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-forest-800 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5 text-forest-300" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-forest-900 block leading-tight">
                Food<span className="text-terracotta-500">Loop</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-stone-500 block">
                Surplus Rescue Network
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-forest-800 font-semibold'
                    : 'text-stone-600 hover:text-forest-800'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'text-forest-800 font-semibold'
                    : 'text-stone-600 hover:text-forest-800'
                }`}
              >
                Dashboard
              </Link>
            )}

            {user?.role === 'donor' && (
              <Link
                to="/donations/create"
                className="text-sm font-medium text-stone-600 hover:text-forest-800"
              >
                Post Surplus
              </Link>
            )}

            {user?.role === 'volunteer' && (
              <Link
                to="/pickups"
                className="text-sm font-medium text-stone-600 hover:text-forest-800"
              >
                Task Board
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link
                to="/admin/verifications"
                className="text-sm font-medium text-purple-700 hover:text-purple-900 font-semibold"
              >
                Admin Hub
              </Link>
            )}
          </nav>

          {/* Right section: Quick Demo Switcher + Notifications + Auth */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-cream-200 hover:bg-cream-300 text-stone-800 border border-stone-300 transition-colors shadow-sm"
                title="Quickly switch between pre-seeded test roles"
              >
                <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
                <span className="hidden sm:inline">Role Switcher</span>
                <span className="sm:hidden">Switch</span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1 border-b border-stone-100 mb-1">
                    <p className="text-[11px] font-bold uppercase text-stone-400">Quick Test Switcher</p>
                    <p className="text-xs text-stone-600">Instantly switch between demo roles</p>
                  </div>
                  <button
                    onClick={() => handleQuickLogin('donor@foodloop.org')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-forest-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-stone-800">Chef Sharma (Restaurant)</p>
                      <p className="text-[10px] text-stone-500">Spice Garden • Donor</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Donor</span>
                  </button>
                  <button
                    onClick={() => handleQuickLogin('ngo@foodloop.org')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-forest-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-stone-800">Hope Community Shelter</p>
                      <p className="text-[10px] text-stone-500">Verified Shelter • NGO</p>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">NGO</span>
                  </button>
                  <button
                    onClick={() => handleQuickLogin('volunteer@foodloop.org')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-forest-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-stone-800">Alex Courier</p>
                      <p className="text-[10px] text-stone-500">Volunteer Courier</p>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Courier</span>
                  </button>
                  <button
                    onClick={() => handleQuickLogin('admin@foodloop.org')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-forest-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-stone-800">Platform Administrator</p>
                      <p className="text-[10px] text-stone-500">Full audit & verification</p>
                    </div>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">Admin</span>
                  </button>
                  <div className="border-t border-stone-100 mt-1 pt-1">
                    <button
                      onClick={() => handleQuickLogin('unverified@foodloop.org')}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-stone-700">Eastside Pantry</p>
                        <p className="text-[10px] text-red-600">Pending Verification</p>
                      </div>
                      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Unverified</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Dropdown (If authenticated) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-stone-600 hover:text-forest-800 hover:bg-stone-100 rounded-full relative transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-terracotta-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-stone-200 py-3 z-50">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-800">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full font-semibold">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAsRead('all')}
                          className="text-xs text-forest-700 hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-stone-400">
                          No notifications yet. You will be alerted when new donations or missions match.
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => markAsRead(n._id)}
                            className={`p-3 text-xs cursor-pointer hover:bg-stone-50 transition-colors ${
                              !n.read ? 'bg-cream-50 font-medium' : 'text-stone-600'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-stone-900">{n.title}</span>
                              <span className="text-[10px] text-stone-400">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-stone-600 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-forest-800 text-white font-bold text-xs flex items-center justify-center">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-stone-800 leading-tight truncate max-w-[120px]">
                      {user.name}
                    </p>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded border ${
                        roleBadgeColors[user.role] || 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-xs font-bold text-stone-900">{user.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5" /> Dashboard
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Organization & Profile
                    </Link>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin/audit-logs"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full px-3 py-2 text-xs text-purple-700 hover:bg-purple-50 flex items-center gap-2 font-semibold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Audit History
                      </Link>
                    )}

                    <div className="border-t border-stone-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-forest-800 hover:text-forest-900 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-forest-800 text-white hover:bg-forest-900 shadow-sm transition-all"
                >
                  Join FoodLoop
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
