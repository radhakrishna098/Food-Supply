import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, AlertCircle, ArrowRight, Sparkles, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-forest-800 text-white flex items-center justify-center mx-auto shadow-md">
            <UtensilsCrossed className="w-6 h-6 text-forest-300" />
          </div>
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Log In to FoodLoop
          </h2>
          <p className="text-xs text-stone-500">
            Select your role or enter credentials to coordinate surplus food rescue
          </p>
        </div>

        {/* 1-CLICK DEMO BUTTONS */}
        <div className="bg-cream-100 rounded-2xl p-4 border border-stone-200 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
            <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
            <span>One-Click Evaluator Demo Accounts:</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemo('donor@foodloop.org')}
              className="p-2 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 text-left transition-colors shadow-2xs"
            >
              <span className="font-bold text-stone-900 block truncate">Chef Sharma</span>
              <span className="text-[10px] text-emerald-700 font-semibold uppercase">Donor (Restaurant)</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('ngo@foodloop.org')}
              className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-200 text-left transition-colors shadow-2xs"
            >
              <span className="font-bold text-stone-900 block truncate">Hope Shelter</span>
              <span className="text-[10px] text-amber-700 font-semibold uppercase">Verified NGO</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('volunteer@foodloop.org')}
              className="p-2 rounded-xl bg-white hover:bg-blue-50 border border-stone-200 text-left transition-colors shadow-2xs"
            >
              <span className="font-bold text-stone-900 block truncate">Alex Courier</span>
              <span className="text-[10px] text-blue-700 font-semibold uppercase">Volunteer</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('admin@foodloop.org')}
              className="p-2 rounded-xl bg-white hover:bg-purple-50 border border-stone-200 text-left transition-colors shadow-2xs"
            >
              <span className="font-bold text-stone-900 block truncate">Administrator</span>
              <span className="text-[10px] text-purple-700 font-semibold uppercase">Admin / Audit</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:border-transparent text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:border-transparent text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-stone-500 pt-2">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-forest-800 hover:underline">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
