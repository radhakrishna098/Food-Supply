import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, AlertCircle, ArrowRight, Building, Truck, ShieldAlert } from 'lucide-react';

export default function Register() {
  const [role, setRole] = useState('recipient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [orgType, setOrgType] = useState('orphanage');
  const [formattedAddress, setFormattedAddress] = useState('Connaught Place, New Delhi');
  const [pinCode, setPinCode] = useState('110001');
  const [maxCapacity, setMaxCapacity] = useState(100);
  const [acceptedCategories, setAcceptedCategories] = useState(['prepared_meals', 'bakery']);
  const [dietaryPreferences, setDietaryPreferences] = useState(['vegetarian', 'vegan']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleCategoryToggle = (cat) => {
    if (acceptedCategories.includes(cat)) {
      setAcceptedCategories(acceptedCategories.filter((c) => c !== cat));
    } else {
      setAcceptedCategories([...acceptedCategories, cat]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (role !== 'volunteer' && !/^[1-9][0-9]{5}$/.test(pinCode.trim())) {
      setError('Please enter a valid 6-digit Indian PIN code (e.g., 110001).');
      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role,
        phone,
        organizationName: role !== 'volunteer' ? organizationName : undefined,
        orgType: role === 'donor' ? (orgType || 'restaurant') : orgType,
        formattedAddress,
        pinCode: pinCode.trim(),
        postalCode: pinCode.trim(),
        maxCapacity: Number(maxCapacity),
        acceptedCategories,
        dietaryPreferences,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Create Your FoodLoop Account
          </h2>
          <p className="text-xs text-stone-500">
            Join the surplus rescue network as a donor, recipient NGO, or volunteer courier
          </p>
        </div>

        {/* ROLE SELECTION TABS */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-cream-200/80 border border-stone-300">
          <button
            type="button"
            onClick={() => setRole('donor')}
            className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              role === 'donor' ? 'bg-white shadow-sm text-forest-900' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
            <span>Food Donor</span>
            <span className="text-[10px] text-stone-400 font-normal hidden sm:inline">Restaurants & Kitchens</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('recipient')}
            className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              role === 'recipient' ? 'bg-white shadow-sm text-forest-900' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Building className="w-4 h-4 text-amber-600" />
            <span>Recipient NGO</span>
            <span className="text-[10px] text-stone-400 font-normal hidden sm:inline">Shelters & Kitchens</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('volunteer')}
            className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              role === 'volunteer' ? 'bg-white shadow-sm text-forest-900' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Volunteer</span>
            <span className="text-[10px] text-stone-400 font-normal hidden sm:inline">Courier Missions</span>
          </button>
        </div>

        {role === 'recipient' && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <strong>Verification Requirement:</strong> New recipient organizations undergo administrative audit before claiming surplus food. You can browse and configure settings immediately.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Full Name / Representative
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sister Teresa or Chef Rajesh"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@entity.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Org details if donor or recipient */}
          {role !== 'volunteer' && (
            <div className="pt-2 border-t border-stone-100 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Organization & Logistics Settings
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Hope Community Shelter"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {role === 'donor' ? 'Donor / Establishment Type' : 'Organization Type'}
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-forest-800 focus:outline-none"
                  >
                    {role === 'donor' ? (
                      <>
                        <option value="restaurant">Restaurant / Eatery</option>
                        <option value="individual">Individual Donor / Resident</option>
                        <option value="shop">Shop / Bakery / Food Mart</option>
                        <option value="event_organizer">Event Organizer / Wedding Banquet</option>
                        <option value="hotel">Hotel / Hospitality Kitchen</option>
                        <option value="caterer">Catering Service</option>
                        <option value="supermarket">Supermarket / Retailer</option>
                      </>
                    ) : (
                      <>
                        <option value="orphanage">Orphanage / Children's Home</option>
                        <option value="old_age_home">Old-Age Home / Senior Care</option>
                        <option value="community_kitchen">Community Kitchen / Langar Seva</option>
                        <option value="shelter">Homeless / Community Shelter</option>
                        <option value="food_bank">Food Bank Distribution Hub</option>
                        <option value="ngo">Registered Social NGO</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Operating Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formattedAddress}
                    onChange={(e) => setFormattedAddress(e.target.value)}
                    placeholder="Street, locality, area name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Indian PIN Code *</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">6 Digits</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="^[1-9][0-9]{5}$"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="110001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono font-bold tracking-wider focus:ring-2 focus:ring-forest-800 focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Local area matching anchor</p>
                </div>
              </div>

              {role === 'recipient' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Maximum Daily Intake Capacity (Servings)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Matching engine prevents overflow claims beyond your stated daily capacity.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-stone-500 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-forest-800 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
