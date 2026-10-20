require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Donation = require('../models/Donation');
const DonationRequest = require('../models/DonationRequest');
const Pickup = require('../models/Pickup');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Message = require('../models/Message');
const CodeService = require('../services/codeService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodloop';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed]: Connected to MongoDB. Clearing previous collections...');

    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Donation.deleteMany({}),
      DonationRequest.deleteMany({}),
      Pickup.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      Message.deleteMany({}),
    ]);

    console.log('[Seed]: Collections wiped. Generating seed data...');

    // 1. CREATE USERS
    // Common password: Password123!
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@foodloop.org',
      password: 'Password123!',
      role: 'admin',
      accountStatus: 'active',
      phone: '+91 98765 00001',
    });

    const donorUser1 = await User.create({
      name: 'Chef Rajesh Sharma (Spice Garden)',
      email: 'donor@foodloop.org',
      password: 'Password123!',
      role: 'donor',
      accountStatus: 'active',
      phone: '+91 98765 00002',
    });

    const donorUser2 = await User.create({
      name: 'Priya Mehra (Artisan Bakehouse)',
      email: 'baker@foodloop.org',
      password: 'Password123!',
      role: 'donor',
      accountStatus: 'active',
      phone: '+91 98765 00003',
    });

    const donorUserIndividual = await User.create({
      name: 'Vikram Sethi (Individual Donor)',
      email: 'individual@foodloop.org',
      password: 'Password123!',
      role: 'donor',
      accountStatus: 'active',
      phone: '+91 98765 00010',
    });

    const recipientUser1 = await User.create({
      name: 'Sister Teresa (Hope Shelter)',
      email: 'ngo@foodloop.org',
      password: 'Password123!',
      role: 'recipient',
      accountStatus: 'active',
      phone: '+91 98765 00004',
    });

    const recipientUserOrphanage = await User.create({
      name: 'Pooja Deshmukh (Bal Asha Orphanage)',
      email: 'orphanage@foodloop.org',
      password: 'Password123!',
      role: 'recipient',
      accountStatus: 'active',
      phone: '+91 98765 00011',
    });

    const recipientUserOldAge = await User.create({
      name: 'Ramesh Chandra (Anand Dham Old-Age Home)',
      email: 'oldage@foodloop.org',
      password: 'Password123!',
      role: 'recipient',
      accountStatus: 'active',
      phone: '+91 98765 00012',
    });

    const recipientUserKitchen = await User.create({
      name: 'Harpreet Singh (Guru Nanak Community Kitchen)',
      email: 'kitchen@foodloop.org',
      password: 'Password123!',
      role: 'recipient',
      accountStatus: 'active',
      phone: '+91 98765 00013',
    });

    const recipientUser2 = await User.create({
      name: 'Arjun Verma (City Food Rescue Bank)',
      email: 'citybank@foodloop.org',
      password: 'Password123!',
      role: 'recipient',
      accountStatus: 'active',
      phone: '+91 98765 00005',
    });

    const recipientUserUnverified = await User.create({
      name: 'Sunita Roy (Eastside Community Pantry)',
      email: 'unverified@foodloop.org',
      password: 'Password123!',
      role: 'recipient',
      accountStatus: 'pending',
      phone: '+91 98765 00006',
    });

    const recipientUserLowCap = await User.create({
      name: 'Kavita Patel (Sunrise Children Haven)',
      email: 'lowcap@foodloop.org',
      password: 'Password123!',
      role: 'recipient',
      accountStatus: 'active',
      phone: '+91 98765 00007',
    });

    const volunteerUser = await User.create({
      name: 'Alex Rivera (Express Volunteer Courier)',
      email: 'volunteer@foodloop.org',
      password: 'Password123!',
      role: 'volunteer',
      accountStatus: 'active',
      phone: '+91 98765 00008',
      volunteerProfile: {
        vehicleType: 'car',
        maxCapacityKg: 40,
        serviceRadiusKm: 25,
        isAvailable: true,
        currentLocation: {
          type: 'Point',
          coordinates: [77.2190, 28.6250],
        },
        completedDeliveriesCount: 12,
      },
    });

    // 2. CREATE ORGANIZATIONS
    // Coordinates centered around Delhi for realistic demo proximity
    // Donor: Connaught Place [77.2197, 28.6328]
    const spiceGardenOrg = await Organization.create({
      owner: donorUser1._id,
      name: 'Spice Garden Fine Dine Restaurant',
      type: 'restaurant',
      verificationStatus: 'verified',
      address: {
        street: 'Block B, Inner Circle, Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        pinCode: '110001',
        formattedAddress: 'Connaught Place, New Delhi, Delhi 110001',
      },
      location: {
        type: 'Point',
        coordinates: [77.2197, 28.6328],
      },
      maxDailyCapacityServings: 500,
      acceptedFoodCategories: ['prepared_meals', 'bakery'],
      dietaryPreferences: ['vegetarian'],
      contactPhone: '+91 98765 00002',
      contactEmail: 'donor@foodloop.org',
      description: 'North Indian & Continental dining with hygienic banquet surplus.',
    });

    const artisanBakehouseOrg = await Organization.create({
      owner: donorUser2._id,
      name: 'The Artisan Bakehouse',
      type: 'shop',
      verificationStatus: 'verified',
      address: {
        street: 'Khan Market',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110003',
        pinCode: '110003',
        formattedAddress: 'Khan Market, New Delhi, Delhi 110003',
      },
      location: {
        type: 'Point',
        coordinates: [77.2270, 28.6003],
      },
      maxDailyCapacityServings: 200,
      acceptedFoodCategories: ['bakery', 'packaged_groceries'],
      dietaryPreferences: ['vegetarian', 'vegan'],
      contactPhone: '+91 98765 00003',
      contactEmail: 'baker@foodloop.org',
      description: 'Artisanal sourdough, baguettes, and fresh pastries.',
    });

    // RECIPIENT 1: Bal Asha Children's Home & Orphanage (SAME PIN 110001 - Top Priority Match!)
    const balAshaOrphanageOrg = await Organization.create({
      owner: recipientUserOrphanage._id,
      name: 'Bal Asha Children Home & Orphanage',
      type: 'orphanage',
      verificationStatus: 'verified',
      verifiedAt: new Date(Date.now() - 45 * 24 * 3600 * 1000),
      verifiedBy: adminUser._id,
      address: {
        street: 'Hanuman Road, Near CP',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        pinCode: '110001',
        formattedAddress: 'Hanuman Road, Connaught Place, New Delhi 110001',
      },
      location: {
        type: 'Point',
        coordinates: [77.2185, 28.6310], // ~0.3 km from donor!
      },
      maxDailyCapacityServings: 120,
      currentDailyClaimedServings: 15,
      acceptedFoodCategories: ['prepared_meals', 'bakery', 'fruits_vegetables', 'dairy_refrigerated'],
      dietaryPreferences: ['vegetarian'],
      operatingHours: { open: '06:30', close: '21:30', daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      serviceRadiusKm: 10,
      hasRefrigeration: true,
      hasVehicle: true,
      contactPhone: '+91 98765 00011',
      contactEmail: 'orphanage@foodloop.org',
      description: 'Providing shelter, care, and nutritious meals to 85 underprivileged and rescued children.',
    });

    // RECIPIENT 2: Anand Dham Senior Living & Old-Age Home (SAME PIN 110001 - Same PIN High Priority!)
    const anandDhamOldAgeOrg = await Organization.create({
      owner: recipientUserOldAge._id,
      name: 'Anand Dham Senior Care & Old-Age Home',
      type: 'old_age_home',
      verificationStatus: 'verified',
      verifiedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
      verifiedBy: adminUser._id,
      address: {
        street: 'Barakhamba Road Lane',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        pinCode: '110001',
        formattedAddress: 'Barakhamba Road, Connaught Place, New Delhi 110001',
      },
      location: {
        type: 'Point',
        coordinates: [77.2230, 28.6300], // ~0.5 km from donor!
      },
      maxDailyCapacityServings: 80,
      currentDailyClaimedServings: 10,
      acceptedFoodCategories: ['prepared_meals', 'bakery', 'dairy_refrigerated'],
      dietaryPreferences: ['vegetarian'],
      operatingHours: { open: '07:00', close: '20:30', daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      serviceRadiusKm: 8,
      hasRefrigeration: true,
      hasVehicle: false,
      contactPhone: '+91 98765 00012',
      contactEmail: 'oldage@foodloop.org',
      description: 'Peaceful residential home for 60 senior citizens needing hygienic, mild, wholesome meals.',
    });

    // RECIPIENT 3: Guru Nanak Community Langar Kitchen (NEARBY PIN 110002)
    const guruNanakKitchenOrg = await Organization.create({
      owner: recipientUserKitchen._id,
      name: 'Guru Nanak Seva Community Langar Kitchen',
      type: 'community_kitchen',
      verificationStatus: 'verified',
      verifiedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000),
      verifiedBy: adminUser._id,
      address: {
        street: 'Asaf Ali Road, Daryaganj',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110002',
        pinCode: '110002',
        formattedAddress: 'Asaf Ali Road, New Delhi, Delhi 110002',
      },
      location: {
        type: 'Point',
        coordinates: [77.2350, 28.6390], // ~1.8 km
      },
      maxDailyCapacityServings: 350,
      currentDailyClaimedServings: 50,
      acceptedFoodCategories: ['prepared_meals', 'packaged_groceries', 'fruits_vegetables', 'bakery'],
      dietaryPreferences: ['vegetarian', 'vegan'],
      operatingHours: { open: '06:00', close: '23:00', daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      serviceRadiusKm: 15,
      hasRefrigeration: true,
      hasVehicle: true,
      contactPhone: '+91 98765 00013',
      contactEmail: 'kitchen@foodloop.org',
      description: 'Daily hot meal langar distribution serving daily wage workers, homeless, and families.',
    });

    // RECIPIENT 4: Hope Shelter (~1.5 km away, PIN 110055)
    const hopeShelterOrg = await Organization.create({
      owner: recipientUser1._id,
      name: 'Hope Community Shelter & Kitchen',
      type: 'shelter',
      verificationStatus: 'verified',
      verifiedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      verifiedBy: adminUser._id,
      address: {
        street: 'Pahar Ganj Relief Lane',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110055',
        pinCode: '110055',
        formattedAddress: 'Paharganj, New Delhi, Delhi 110055',
      },
      location: {
        type: 'Point',
        coordinates: [77.2120, 28.6430], // ~1.5 km from donor!
      },
      maxDailyCapacityServings: 150,
      currentDailyClaimedServings: 20,
      acceptedFoodCategories: ['prepared_meals', 'packaged_groceries', 'fruits_vegetables', 'bakery'],
      dietaryPreferences: ['vegetarian', 'vegan'],
      operatingHours: { open: '07:00', close: '22:00', daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      serviceRadiusKm: 15,
      hasRefrigeration: true,
      hasVehicle: true,
      contactPhone: '+91 98765 00004',
      contactEmail: 'ngo@foodloop.org',
      description: 'Serving hot, nutritious meals to over 100 shelter residents every evening.',
    });

    // NGO 2: City Food Bank (~6 km away, large capacity)
    const cityBankOrg = await Organization.create({
      owner: recipientUser2._id,
      name: 'Delhi Central Food Rescue Bank',
      type: 'food_bank',
      verificationStatus: 'verified',
      verifiedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000),
      verifiedBy: adminUser._id,
      address: {
        street: 'Ring Road, Civil Lines',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110054',
        pinCode: '110054',
        formattedAddress: 'Civil Lines, New Delhi, Delhi 110054',
      },
      location: {
        type: 'Point',
        coordinates: [77.2250, 28.6800], // ~5.5 km
      },
      maxDailyCapacityServings: 400,
      currentDailyClaimedServings: 100,
      acceptedFoodCategories: ['prepared_meals', 'packaged_groceries', 'fruits_vegetables', 'bakery', 'dairy_refrigerated'],
      dietaryPreferences: ['vegetarian', 'vegan', 'halal'],
      operatingHours: { open: '08:00', close: '20:00', daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      serviceRadiusKm: 20,
      hasRefrigeration: true,
      hasVehicle: true,
      contactPhone: '+91 98765 00005',
      contactEmail: 'citybank@foodloop.org',
      description: 'Large distribution hub supplying multiple community pantries.',
    });

    // NGO 3: UNVERIFIED Organization (Pending admin verification gate)
    const eastsideUnverifiedOrg = await Organization.create({
      owner: recipientUserUnverified._id,
      name: 'Eastside Community Relief Pantry',
      type: 'community_kitchen',
      verificationStatus: 'pending',
      verificationDocuments: [
        {
          docType: 'Society Registration Certificate',
          docNumber: 'DEL-NGO-88291-PENDING',
          fileUrl: 'https://docs.foodloop.org/samples/pending_cert.pdf',
        },
      ],
      address: {
        street: 'Laxmi Nagar Main Market',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110092',
        pinCode: '110092',
        formattedAddress: 'Laxmi Nagar, New Delhi, Delhi 110092',
      },
      location: {
        type: 'Point',
        coordinates: [77.2770, 28.6310], // ~6 km East
      },
      maxDailyCapacityServings: 120,
      currentDailyClaimedServings: 0,
      acceptedFoodCategories: ['prepared_meals', 'bakery'],
      dietaryPreferences: ['vegetarian'],
      serviceRadiusKm: 15,
      hasRefrigeration: true,
      hasVehicle: false,
      contactPhone: '+91 98765 00006',
      contactEmail: 'unverified@foodloop.org',
      description: 'Newly registered community kitchen pending platform verification.',
    });

    // NGO 4: INSUFFICIENT CAPACITY Organization (Only 10 servings remaining!)
    const lowCapOrg = await Organization.create({
      owner: recipientUserLowCap._id,
      name: 'Sunrise Children Haven',
      type: 'shelter',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      address: {
        street: 'Karol Bagh Market',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110005',
        pinCode: '110005',
        formattedAddress: 'Karol Bagh, New Delhi, Delhi 110005',
      },
      location: {
        type: 'Point',
        coordinates: [77.1900, 28.6500],
      },
      maxDailyCapacityServings: 50,
      currentDailyClaimedServings: 42, // Only 8 servings remaining! Cannot fit 50 servings.
      acceptedFoodCategories: ['prepared_meals', 'bakery'],
      dietaryPreferences: ['vegetarian'],
      serviceRadiusKm: 10,
      hasRefrigeration: true,
      hasVehicle: false,
      contactPhone: '+91 98765 00007',
      contactEmail: 'lowcap@foodloop.org',
      description: 'Small shelter for orphaned children with limited daily kitchen capacity.',
    });

    // NGO 5: OUTSIDE SERVICE RADIUS Organization (~45 km away in Gurgaon suburb with 10km radius)
    const distantOrgUser = await User.create({
      name: 'Faraway Shelter Team',
      email: 'distant@foodloop.org',
      password: 'Password123!',
      role: 'recipient',
      accountStatus: 'active',
      phone: '+91 98765 00009',
    });
    const distantOrg = await Organization.create({
      owner: distantOrgUser._id,
      name: 'South Suburban Care Foundation',
      type: 'shelter',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      address: {
        street: 'Sohna Road',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122018',
        pinCode: '122018',
        formattedAddress: 'Sohna Road, Gurugram, Haryana 122018',
      },
      location: {
        type: 'Point',
        coordinates: [77.0400, 28.3800], // ~35 km away
      },
      maxDailyCapacityServings: 200,
      currentDailyClaimedServings: 0,
      acceptedFoodCategories: ['prepared_meals'],
      dietaryPreferences: ['vegetarian'],
      serviceRadiusKm: 10, // Max 10 km, so 35 km is strictly out of radius!
      hasRefrigeration: true,
      hasVehicle: true,
      contactPhone: '+91 98765 00009',
      contactEmail: 'distant@foodloop.org',
      description: 'Peripheral suburban community center.',
    });

    // 3. CREATE DONATIONS

    const now = new Date();

    // DONATION 1: The Master Scenario Donation (50 portions vegetarian meals)
    const donation1 = await Donation.create({
      donor: donorUser1._id,
      donorOrg: spiceGardenOrg._id,
      donorType: 'restaurant',
      pinCode: '110001',
      foodTitle: '50 Gourmet Vegetarian Meal Portions (Dal Makhani, Jeera Rice & Phulkas)',
      category: 'prepared_meals',
      description: 'Freshly prepared banquet surplus from corporate luncheon. Steam-table held, packaged in tamper-evident food-grade containers.',
      quantity: 50,
      remainingQuantity: 50,
      unit: 'portions',
      estimatedServings: 50,
      dietaryClassification: ['vegetarian'],
      allergenInfo: ['dairy'],
      preparationTime: new Date(now.getTime() - 90 * 60 * 1000), // 1.5 hours ago
      collectionWindow: {
        startTime: new Date(now.getTime() - 30 * 60 * 1000),
        deadline: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours window
      },
      storageAndHandling: {
        storageType: 'hot_holding',
        handlingInstructions: 'Held at >65C until packaging. Keep insulated containers sealed during courier transit.',
        packagingType: 'Insulated food-grade thermal containers',
      },
      safetyDeclaration: {
        isSafeAndEdible: true,
        storedAtSafeTemperature: true,
        preparedWithCleanUtensils: true,
        declaredBy: 'Chef Rajesh Sharma',
        declaredAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
      pickupAddress: {
        formattedAddress: 'Spice Garden, Inner Circle, Connaught Place, New Delhi',
      },
      location: {
        type: 'Point',
        coordinates: [77.2197, 28.6328],
      },
      specialCollectionInstructions: 'Service entrance via rear alley near Gate 4. Staff will assist loading.',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      status: 'AVAILABLE',
    });

    // DONATION 2: Bakery Assortment
    const donation2 = await Donation.create({
      donor: donorUser2._id,
      donorOrg: artisanBakehouseOrg._id,
      donorType: 'shop',
      pinCode: '110003',
      foodTitle: 'Artisan Bakery Assortment (35 Fresh Loaves & Pastries)',
      category: 'bakery',
      description: 'Day-end assortment of rustic sourdough loaves, multi-grain rolls, and vegetarian breakfast croissants.',
      quantity: 35,
      remainingQuantity: 35,
      unit: 'portions',
      estimatedServings: 70,
      dietaryClassification: ['vegetarian'],
      allergenInfo: ['gluten', 'dairy'],
      preparationTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      collectionWindow: {
        startTime: now,
        deadline: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      },
      storageAndHandling: {
        storageType: 'room_temperature',
        handlingInstructions: 'Store in dry bakery crates away from moisture.',
        packagingType: 'Paper bakery bags and wooden crates',
      },
      safetyDeclaration: {
        isSafeAndEdible: true,
        storedAtSafeTemperature: true,
        preparedWithCleanUtensils: true,
        declaredBy: 'Priya Mehra',
        declaredAt: now,
      },
      pickupAddress: {
        formattedAddress: 'The Artisan Bakehouse, Khan Market, New Delhi',
      },
      location: {
        type: 'Point',
        coordinates: [77.2270, 28.6003],
      },
      status: 'AVAILABLE',
    });

    // DONATION 3: Near-Deadline Donation (Tests urgency & time-margin scoring)
    const donation3 = await Donation.create({
      donor: donorUser1._id,
      donorOrg: spiceGardenOrg._id,
      donorType: 'restaurant',
      pinCode: '110001',
      foodTitle: 'Hot Vegetable Biryani with Raita (30 Servings)',
      category: 'prepared_meals',
      description: 'Buffet surplus needing immediate distribution before dinner shift.',
      quantity: 30,
      remainingQuantity: 30,
      unit: 'portions',
      estimatedServings: 30,
      dietaryClassification: ['vegetarian'],
      allergenInfo: ['dairy', 'nuts'],
      preparationTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      collectionWindow: {
        startTime: new Date(now.getTime() - 60 * 60 * 1000),
        deadline: new Date(now.getTime() + 50 * 60 * 1000), // Only 50 minutes left!
      },
      storageAndHandling: {
        storageType: 'hot_holding',
        handlingInstructions: 'Consume or refrigerate immediately upon delivery.',
        packagingType: 'Sealed foil trays',
      },
      safetyDeclaration: {
        isSafeAndEdible: true,
        storedAtSafeTemperature: true,
        preparedWithCleanUtensils: true,
        declaredBy: 'Chef Rajesh Sharma',
        declaredAt: now,
      },
      pickupAddress: {
        formattedAddress: 'Spice Garden, Connaught Place, New Delhi',
      },
      location: {
        type: 'Point',
        coordinates: [77.2197, 28.6328],
      },
      status: 'AVAILABLE',
    });

    // DONATION 4: No Feasible Match Case (Specialized Frozen Seafood in Vegetarian Region)
    const donation4 = await Donation.create({
      donor: donorUser1._id,
      donorOrg: spiceGardenOrg._id,
      donorType: 'restaurant',
      pinCode: '110001',
      foodTitle: 'Commercial Deep-Frozen Salmon Portions (300 Portions)',
      category: 'frozen',
      description: 'Export-grade flash-frozen salmon fillets requiring deep sub-zero freezer cold-chain transport.',
      quantity: 300,
      remainingQuantity: 300,
      unit: 'portions',
      estimatedServings: 300, // Exceeds capacity of all local shelters!
      dietaryClassification: ['non_vegetarian'], // Incompatible with strict vegetarian shelters!
      allergenInfo: ['fish'],
      preparationTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      collectionWindow: {
        startTime: now,
        deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      },
      storageAndHandling: {
        storageType: 'frozen',
        handlingInstructions: 'Maintain at -18C continuous cold chain.',
        packagingType: 'Vacuum-sealed cryogenic boxes',
      },
      safetyDeclaration: {
        isSafeAndEdible: true,
        storedAtSafeTemperature: true,
        preparedWithCleanUtensils: true,
        declaredBy: 'Chef Rajesh Sharma',
        declaredAt: now,
      },
      pickupAddress: {
        formattedAddress: 'Spice Garden Cold Storage, Connaught Place, New Delhi',
      },
      location: {
        type: 'Point',
        coordinates: [77.2197, 28.6328],
      },
      status: 'AVAILABLE',
    });

    // DONATION 5: Individual Donor Surplus (20 portions homemade pulao)
    const donation5 = await Donation.create({
      donor: donorUserIndividual._id,
      donorType: 'individual',
      pinCode: '110001',
      foodTitle: '20 Homemade Vegetable Pulao & Raita Portions',
      category: 'prepared_meals',
      description: 'Family gathering surplus prepared at home under clean hygienic conditions. Packed in sealed meal boxes.',
      quantity: 20,
      remainingQuantity: 20,
      unit: 'portions',
      estimatedServings: 20,
      dietaryClassification: ['vegetarian'],
      allergenInfo: ['dairy'],
      preparationTime: new Date(now.getTime() - 60 * 60 * 1000),
      collectionWindow: {
        startTime: now,
        deadline: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      },
      storageAndHandling: {
        storageType: 'room_temperature',
        handlingInstructions: 'Keep in warm containers until distribution.',
        packagingType: 'Sealed individual foil meal boxes',
      },
      safetyDeclaration: {
        isSafeAndEdible: true,
        storedAtSafeTemperature: true,
        preparedWithCleanUtensils: true,
        declaredBy: 'Vikram Sethi',
        declaredAt: now,
      },
      pickupAddress: {
        formattedAddress: 'Apartment 4B, Tolstoy Marg, Connaught Place, New Delhi 110001',
      },
      location: {
        type: 'Point',
        coordinates: [77.2205, 28.6295],
      },
      status: 'AVAILABLE',
    });

    // DONATION 6: COMPLETED HISTORIC DONATION FOR IMPACT ANALYTICS
    const historicDonation = await Donation.create({
      donor: donorUser1._id,
      donorOrg: spiceGardenOrg._id,
      donorType: 'restaurant',
      pinCode: '110001',
      foodTitle: 'Paneer Butter Masala & Rice (80 Servings)',
      category: 'prepared_meals',
      description: 'Evening conference surplus rescued and successfully served.',
      quantity: 80,
      remainingQuantity: 0,
      unit: 'portions',
      estimatedServings: 80,
      dietaryClassification: ['vegetarian'],
      preparationTime: new Date(now.getTime() - 26 * 60 * 60 * 1000),
      collectionWindow: {
        startTime: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        deadline: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      },
      storageAndHandling: {
        storageType: 'hot_holding',
        handlingInstructions: 'Delivered hot to community shelter.',
      },
      safetyDeclaration: {
        isSafeAndEdible: true,
        storedAtSafeTemperature: true,
        preparedWithCleanUtensils: true,
        declaredBy: 'Chef Rajesh Sharma',
        declaredAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
      },
      pickupAddress: {
        formattedAddress: 'Connaught Place, New Delhi',
      },
      location: {
        type: 'Point',
        coordinates: [77.2197, 28.6328],
      },
      status: 'DELIVERED',
      createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
    });

    const historicRequest = await DonationRequest.create({
      donation: historicDonation._id,
      recipientOrg: hopeShelterOrg._id,
      requestedBy: recipientUser1._id,
      requestedQuantity: 80,
      requestedServings: 80,
      status: 'COMPLETED',
      matchScoreSnapshot: {
        totalScore: 94,
        proximityScore: 96,
        capacityScore: 95,
        timeScore: 90,
        dietaryScore: 100,
        distanceKm: 1.5,
        estimatedTransitMinutes: 18,
        reasons: ['Optimal proximity (1.5 km)', 'Direct dietary fit', 'Generous safety window'],
      },
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    });

    const historicPickup = await Pickup.create({
      donationRequest: historicRequest._id,
      donation: historicDonation._id,
      donor: donorUser1._id,
      recipientOrg: hopeShelterOrg._id,
      recipientUser: recipientUser1._id,
      assignedVolunteer: volunteerUser._id,
      status: 'DELIVERED',
      pickupVerificationCodeHash: CodeService.hashCode('482910'),
      deliveryVerificationCodeHash: CodeService.hashCode('719402'),
      pickupCode: '482910',
      deliveryCode: '719402',
      pickupAddress: {
        formattedAddress: 'Connaught Place, New Delhi',
        coordinates: [77.2197, 28.6328],
      },
      deliveryAddress: {
        formattedAddress: 'Paharganj, New Delhi, Delhi 110055',
        coordinates: [77.2120, 28.6430],
      },
      timeline: [
        {
          status: 'ASSIGNED',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          updatedBy: donorUser1._id,
        },
        {
          status: 'ACCEPTED_BY_VOLUNTEER',
          timestamp: new Date(now.getTime() - 23.5 * 60 * 60 * 1000),
          updatedBy: volunteerUser._id,
        },
        {
          status: 'COLLECTED',
          timestamp: new Date(now.getTime() - 23 * 60 * 60 * 1000),
          updatedBy: volunteerUser._id,
        },
        {
          status: 'DELIVERED',
          timestamp: new Date(now.getTime() - 22 * 60 * 60 * 1000),
          updatedBy: volunteerUser._id,
        },
      ],
      collectedAt: new Date(now.getTime() - 23 * 60 * 60 * 1000),
      deliveredAt: new Date(now.getTime() - 22 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    });

    // 4. SEED DEMO CHAT MESSAGES
    await Message.create({
      donation: historicDonation._id,
      donationRequest: historicRequest._id,
      sender: donorUser1._id,
      senderName: donorUser1.name,
      senderRole: 'donor',
      text: 'Hello! The 80 servings of Paneer Butter Masala are packed in thermal containers at our rear loading dock.',
      readBy: [donorUser1._id, recipientUser1._id, volunteerUser._id],
      createdAt: new Date(now.getTime() - 23.8 * 60 * 60 * 1000),
    });

    await Message.create({
      donation: historicDonation._id,
      donationRequest: historicRequest._id,
      sender: volunteerUser._id,
      senderName: volunteerUser.name,
      senderRole: 'volunteer',
      text: 'Thanks Chef Rajesh! I have arrived at Gate 4 and verified the pickup code.',
      readBy: [donorUser1._id, recipientUser1._id, volunteerUser._id],
      createdAt: new Date(now.getTime() - 23.1 * 60 * 60 * 1000),
    });

    await Message.create({
      donation: historicDonation._id,
      donationRequest: historicRequest._id,
      sender: recipientUser1._id,
      senderName: recipientUser1.name,
      senderRole: 'recipient',
      text: 'Food arrived in excellent hot condition. The shelter residents are deeply grateful!',
      readBy: [donorUser1._id, recipientUser1._id, volunteerUser._id],
      createdAt: new Date(now.getTime() - 22 * 60 * 60 * 1000),
    });

    // 5. SEED AUDIT LOG
    await AuditLog.create({
      actor: volunteerUser._id,
      actorName: volunteerUser.name,
      actorRole: 'volunteer',
      action: 'DELIVERY_HANDOVER_VERIFIED',
      entityType: 'Pickup',
      entityId: String(historicPickup._id),
      previousState: { status: 'COLLECTED' },
      newState: { status: 'DELIVERED' },
      metadata: { servingsRescued: 80, foodTitle: historicDonation.foodTitle },
      timestamp: historicPickup.deliveredAt,
    });

    console.log('[Seed]: Successfully populated database with demo records!');
    console.log('--------------------------------------------------------------------------------');
    console.log('DEMO ACCOUNTS (Common Password: Password123!):');
    console.log('1. Admin:           admin@foodloop.org      (System Administrator)');
    console.log('2. Restaurant Donor: donor@foodloop.org      (Spice Garden, PIN: 110001)');
    console.log('3. Shop/Bakery:     baker@foodloop.org      (Artisan Bakehouse, PIN: 110003)');
    console.log('4. Individual Donor: individual@foodloop.org (Vikram Sethi, PIN: 110001)');
    console.log('5. Orphanage:       orphanage@foodloop.org  (Bal Asha Orphanage, PIN: 110001 - Same PIN Match)');
    console.log('6. Old-Age Home:    oldage@foodloop.org     (Anand Dham Old-Age Home, PIN: 110001 - Same PIN Match)');
    console.log('7. Community Kitchen: kitchen@foodloop.org  (Guru Nanak Langar Seva, PIN: 110002 - Nearby PIN)');
    console.log('8. Shelter NGO:     ngo@foodloop.org        (Hope Shelter & Kitchen, PIN: 110055)');
    console.log('9. Food Bank:       citybank@foodloop.org   (Delhi Central Food Bank, PIN: 110054)');
    console.log('10. Volunteer:      volunteer@foodloop.org  (Alex Rivera, 25km radius courier)');
    console.log('11. Unverified Org: unverified@foodloop.org (Pending Admin Approval)');
    console.log('12. Low Capacity:   lowcap@foodloop.org     (Capacity Constrained)');
    console.log('--------------------------------------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
}

seedDatabase();
