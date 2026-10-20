import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  MapPin,
  List,
  Filter,
  Search,
  Clock,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import DonationCard from '../components/DonationCard';
import MapView from '../components/MapView';

export default function AvailableDonations() {
  const [donations, setDonations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('both'); // 'both', 'map', 'list'

  // Filters
  const [search, setSearch] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [donorType, setDonorType] = useState('');
  const [category, setCategory] = useState('');
  const [dietary, setDietary] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('claimableOnly', 'true');
      if (search) queryParams.append('search', search);
      if (pinCode) queryParams.append('pinCode', pinCode.trim());
      if (donorType) queryParams.append('donorType', donorType);
      if (category) queryParams.append('category', category);
      if (dietary) queryParams.append('dietary', dietary);

      const [donationsRes, orgsRes] = await Promise.all([
        api.get(`/donations?${queryParams.toString()}`),
        api.get('/organizations?verifiedOnly=true'),
      ]);

      if (donationsRes.data.success) setDonations(donationsRes.data.donations);
      if (orgsRes.data.success) setOrganizations(orgsRes.data.organizations);
    } catch (err) {
      console.error('Failed to load donations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category, dietary, donorType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* HEADER & VIEW TOGGLES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
            Real-Time Surplus Inventory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Surplus Food Rescue Map & Directory
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Browse verified available food batches awaiting community shelter intake
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-cream-200/80 p-1 border border-stone-300 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              viewMode === 'both' ? 'bg-white shadow-sm text-forest-900' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              viewMode === 'map' ? 'bg-white shadow-sm text-forest-900' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Map Only
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-white shadow-sm text-forest-900' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            List Only
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex flex-col md:flex-row items-center gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by food name, description, ingredients..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-800"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              maxLength={6}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="PIN: 110001"
              className="w-28 pl-7 pr-2.5 py-2 rounded-xl border border-stone-300 bg-white font-mono font-bold text-stone-800 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
            />
          </div>

          <select
            value={donorType}
            onChange={(e) => setDonorType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium text-stone-700"
          >
            <option value="">All Donors</option>
            <option value="restaurant">Restaurant</option>
            <option value="individual">Individual</option>
            <option value="shop">Shop / Bakery</option>
            <option value="event_organizer">Event Organizer</option>
            <option value="hotel">Hotel</option>
            <option value="supermarket">Supermarket</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium text-stone-700"
          >
            <option value="">All Categories</option>
            <option value="prepared_meals">Prepared Meals</option>
            <option value="bakery">Bakery Assortment</option>
            <option value="packaged_groceries">Packaged Groceries</option>
            <option value="fruits_vegetables">Produce / Veggies</option>
            <option value="dairy_refrigerated">Dairy & Chilled</option>
            <option value="frozen">Frozen Food</option>
          </select>

          <select
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium text-stone-700"
          >
            <option value="">All Dietary</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="halal">Halal</option>
            <option value="non_vegetarian">Non-Vegetarian</option>
          </select>

          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold shadow-sm transition-colors"
          >
            Filter
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      {(viewMode === 'both' || viewMode === 'map') && (
        <div className="space-y-2">
          <MapView donations={donations} organizations={organizations} height={viewMode === 'map' ? '560px' : '360px'} />
          <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-forest-800 inline-block"></span> Surplus Food Location
              <span className="w-2.5 h-2.5 rounded-full bg-terracotta-500 inline-block ml-3"></span> Verified Recipient Shelter
            </span>
            <span>Displaying {donations.length} active donations</span>
          </div>
        </div>
      )}

      {(viewMode === 'both' || viewMode === 'list') && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-stone-900">
            Available Surplus Batches ({donations.length})
          </h2>

          {loading ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading surplus listings...</div>
          ) : donations.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
              <UtensilsCrossed className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-stone-700">No surplus donations match the current filter criteria</p>
              <p className="text-[11px] text-stone-500 mt-1">Try clearing filters or check back shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {donations.map((donation) => (
                <DonationCard key={donation._id} donation={donation} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
