import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  ShieldCheck,
  Clock,
  MapPin,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function CreateDonation() {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [donorType, setDonorType] = useState(organization?.type || 'restaurant');
  const [pinCode, setPinCode] = useState(
    organization?.address?.pinCode || organization?.address?.postalCode || '110001'
  );
  const [foodTitle, setFoodTitle] = useState('');
  const [category, setCategory] = useState('prepared_meals');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [unit, setUnit] = useState('portions');
  const [estimatedServings, setEstimatedServings] = useState(50);
  const [dietaryClassification, setDietaryClassification] = useState(['vegetarian']);
  const [allergenInfo, setAllergenInfo] = useState(['dairy']);
  const [storageType, setStorageType] = useState('hot_holding');
  const [handlingInstructions, setHandlingInstructions] = useState('Keep insulated food containers sealed during transit.');
  const [packagingType, setPackagingType] = useState('Food-grade thermal containers');

  // Timestamps
  const now = new Date();
  const defaultPrep = new Date(now.getTime() - 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const [preparationTime, setPreparationTime] = useState(defaultPrep);
  const [collectionDeadline, setCollectionDeadline] = useState(defaultDeadline);

  // Address
  const [formattedAddress, setFormattedAddress] = useState(
    organization?.address?.formattedAddress || 'Connaught Place, New Delhi, Delhi 110001'
  );
  const [specialInstructions, setSpecialInstructions] = useState(
    'Kitchen entrance via rear service lane. Staff will assist with container loading.'
  );
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'
  );

  // Mandatory Safety Declarations
  const [safetyEdible, setSafetyEdible] = useState(false);
  const [safetyTemp, setSafetyTemp] = useState(false);
  const [safetyHygiene, setSafetyHygiene] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDietaryToggle = (item) => {
    if (dietaryClassification.includes(item)) {
      setDietaryClassification(dietaryClassification.filter((d) => d !== item));
    } else {
      setDietaryClassification([...dietaryClassification, item]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!safetyEdible || !safetyTemp || !safetyHygiene) {
      setError('All three mandatory food safety affirmations must be checked prior to posting.');
      return;
    }

    const prepDate = new Date(preparationTime);
    const deadlineDate = new Date(collectionDeadline);

    if (deadlineDate <= new Date()) {
      setError('Collection deadline must be scheduled in the future.');
      return;
    }

    if (prepDate > new Date(Date.now() + 5 * 60 * 1000)) {
      setError('Preparation timestamp cannot be in the future.');
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(pinCode.trim())) {
      setError('Please enter a valid 6-digit Indian PIN code (e.g., 110001).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        donorType,
        pinCode: pinCode.trim(),
        foodTitle,
        category,
        description,
        quantity: Number(quantity),
        unit,
        estimatedServings: Number(estimatedServings),
        dietaryClassification,
        allergenInfo,
        preparationTime: prepDate,
        collectionWindow: {
          startTime: new Date(),
          deadline: deadlineDate,
        },
        storageAndHandling: {
          storageType,
          handlingInstructions,
          packagingType,
        },
        safetyDeclaration: {
          isSafeAndEdible: safetyEdible,
          storedAtSafeTemperature: safetyTemp,
          preparedWithCleanUtensils: safetyHygiene,
        },
        pickupAddress: {
          formattedAddress,
        },
        coordinates: organization?.location?.coordinates || [77.2197, 28.6328],
        specialCollectionInstructions: specialInstructions,
        imageUrl,
      };

      const res = await api.post('/donations', payload);
      if (res.data.success) {
        // Redirect directly to the Smart Matching Center for this new donation!
        navigate(`/matching/${res.data.donation._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post donation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* HEADER */}
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Surplus Food Rescue Posting
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
          Post Surplus Food Donation
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Declare surplus food details, safety handling, and collection windows. FoodLoop’s matching engine will immediately calculate eligible recipients.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: FOOD DETAILS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-5">
          <h2 className="text-base font-extrabold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-forest-800" />
            <span>1. Food Description & Quantity</span>
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Food Item Name / Title *
            </label>
            <input
              type="text"
              required
              value={foodTitle}
              onChange={(e) => setFoodTitle(e.target.value)}
              placeholder="e.g. 50 Gourmet Vegetarian Meal Portions (Dal Makhani, Jeera Rice & Phulkas)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Donor Type / Organization *
              </label>
              <select
                value={donorType}
                onChange={(e) => setDonorType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-forest-800 focus:outline-none"
              >
                <option value="restaurant">Restaurant / Eatery</option>
                <option value="individual">Individual Donor / Resident</option>
                <option value="shop">Shop / Bakery / Food Mart</option>
                <option value="event_organizer">Event Organizer / Wedding Banquet</option>
                <option value="hotel">Hotel / Hospitality Kitchen</option>
                <option value="caterer">Catering Service</option>
                <option value="supermarket">Supermarket / Grocery Retailer</option>
                <option value="other">Other Institution</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Food Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              >
                <option value="prepared_meals">Hot Prepared Meals</option>
                <option value="bakery">Bakery & Breads</option>
                <option value="packaged_groceries">Packaged Groceries</option>
                <option value="fruits_vegetables">Fresh Fruits & Vegetables</option>
                <option value="dairy_refrigerated">Dairy & Chilled</option>
                <option value="canned_goods">Canned & Preserved</option>
                <option value="frozen">Frozen Goods</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Quantity *
              </label>
              <input
                type="number"
                min={0.1}
                step="any"
                required
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setEstimatedServings(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Unit of Measure *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              >
                <option value="portions">Portions</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="boxes">Boxes</option>
                <option value="trays">Trays</option>
                <option value="liters">Liters</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Estimated People Fed *
              </label>
              <input
                type="number"
                min={1}
                required
                value={estimatedServings}
                onChange={(e) => setEstimatedServings(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none font-bold text-forest-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Dietary Classifications
            </label>
            <div className="flex flex-wrap gap-2">
              {['vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free', 'nut_free', 'non_vegetarian'].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => handleDietaryToggle(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    dietaryClassification.includes(d)
                      ? 'bg-forest-800 text-white border-forest-800 shadow-xs'
                      : 'bg-cream-50 text-stone-700 border-stone-300 hover:bg-cream-100'
                  }`}
                >
                  {d.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Item Details & Ingredients Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fresh banquet surplus from corporate luncheon. Prepared in hygienic commercial kitchen."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION 2: TIMESTAMPS & DEADLINES */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-5">
          <h2 className="text-base font-extrabold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-terracotta-600" />
            <span>2. Preparation Time & Collection Deadline</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Preparation Timestamp *
              </label>
              <input
                type="datetime-local"
                required
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              />
              <p className="text-[10px] text-stone-500 mt-1">Must not be in the future.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Collection Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={collectionDeadline}
                onChange={(e) => setCollectionDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none font-bold text-red-600"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                Surplus will be automatically closed after this deadline to ensure safety.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: STORAGE & PICKUP LOCATION */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-5">
          <h2 className="text-base font-extrabold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-forest-800" />
            <span>3. Storage Conditions & Pickup Location</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Storage Method *
              </label>
              <select
                value={storageType}
                onChange={(e) => setStorageType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              >
                <option value="hot_holding">Hot Holding (&gt;65°C steam table)</option>
                <option value="refrigerated">Refrigerated (0°C to 4°C)</option>
                <option value="room_temperature">Room Temperature (Bakery / Produce)</option>
                <option value="frozen">Deep Frozen (&lt; -18°C)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Packaging Condition
              </label>
              <input
                type="text"
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
                placeholder="Food-grade thermal containers"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Pickup Physical Address *
              </label>
              <input
                type="text"
                required
                value={formattedAddress}
                onChange={(e) => setFormattedAddress(e.target.value)}
                placeholder="Street address, building, landmark"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center justify-between">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Special Courier Instructions
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Gate 4 service entrance, ask for Duty Chef."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Food Image URL (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: MANDATORY FOOD SAFETY DECLARATION */}
        <div className="bg-emerald-50/80 rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-extrabold text-emerald-950">
              4. Mandatory Donor Food Safety Declarations
            </h2>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            As an institutional food donor, you certify compliance with applicable food safety standards. These declarations are stored in the permanent audit trail.
          </p>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={safetyEdible}
                onChange={(e) => setSafetyEdible(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-forest-800 rounded border-stone-300 focus:ring-forest-800"
              />
              <span className="text-xs text-stone-800 font-medium">
                I declare that the surplus food is freshly prepared, edible, and unadulterated.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={safetyTemp}
                onChange={(e) => setSafetyTemp(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-forest-800 rounded border-stone-300 focus:ring-forest-800"
              />
              <span className="text-xs text-stone-800 font-medium">
                I declare that the food has been continuously maintained at safe temperatures (hot holding &gt;65°C or chilled &lt;4°C).
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={safetyHygiene}
                onChange={(e) => setSafetyHygiene(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-forest-800 rounded border-stone-300 focus:ring-forest-800"
              />
              <span className="text-xs text-stone-800 font-medium">
                I declare that food handling followed hygienic standards using clean food-grade utensils and sealed containers.
              </span>
            </label>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Publish & Open Smart Matching Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
