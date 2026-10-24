const User = require('../models/User');
const Organization = require('../models/Organization');

/**
 * Idempotently ensures that core system accounts (Administrator, Donor, NGO, Volunteer, and Unverified demo accounts)
 * exist in the database with their respective organizations and standard credentials ('Password123!').
 *
 * This guarantees that:
 * 1. Admin login is ALWAYS possible on fresh database deployments (Atlas or local) without running destructive wipes.
 * 2. Role Switcher works out of the box in production.
 * 3. Registered NGOs awaiting verification can be vetted immediately by the Admin.
 */
async function ensureSystemAccounts() {
  const summary = {
    usersCreated: [],
    usersUpdated: [],
    orgsCreated: [],
  };

  // 1. Ensure Admin Account
  let admin = await User.findOne({ email: 'admin@foodloop.org' }).select('+password');
  if (!admin) {
    admin = await User.create({
      name: 'System Administrator',
      email: 'admin@foodloop.org',
      password: 'Password123!',
      role: 'admin',
      accountStatus: 'active',
      phone: '+91 98765 00001',
    });
    summary.usersCreated.push(admin.email);
  } else {
    let passwordMatches = false;
    try {
      passwordMatches = await admin.comparePassword('Password123!');
    } catch (e) {
      passwordMatches = false;
    }
    if (!passwordMatches || admin.role !== 'admin' || admin.accountStatus !== 'active') {
      admin.role = 'admin';
      admin.accountStatus = 'active';
      admin.password = 'Password123!';
      await admin.save();
      summary.usersUpdated.push(admin.email);
    }
  }

  // 2. Ensure Demo Donor Account (Chef Sharma)
  let donor = await User.findOne({ email: 'donor@foodloop.org' }).select('+password');
  if (!donor) {
    donor = await User.create({
      name: 'Chef Rajesh Sharma (Spice Garden)',
      email: 'donor@foodloop.org',
      password: 'Password123!',
      role: 'donor',
      accountStatus: 'active',
      phone: '+91 98765 00002',
    });
    summary.usersCreated.push(donor.email);
  } else {
    let passwordMatches = false;
    try {
      passwordMatches = await donor.comparePassword('Password123!');
    } catch (e) {
      passwordMatches = false;
    }
    if (!passwordMatches || donor.accountStatus !== 'active') {
      donor.accountStatus = 'active';
      donor.password = 'Password123!';
      await donor.save();
      summary.usersUpdated.push(donor.email);
    }
  }

  // Ensure Donor Organization (Spice Garden)
  let spiceGarden = await Organization.findOne({ owner: donor._id });
  if (!spiceGarden) {
    spiceGarden = await Organization.create({
      owner: donor._id,
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
    summary.orgsCreated.push(spiceGarden.name);
  }

  // 3. Ensure Demo NGO Account (Hope Shelter)
  let ngo = await User.findOne({ email: 'ngo@foodloop.org' }).select('+password');
  if (!ngo) {
    ngo = await User.create({
      name: 'Sister Teresa (Hope Shelter)',
      email: 'ngo@foodloop.org',
      password: 'Password123!',
      role: 'recipient',
      accountStatus: 'active',
      phone: '+91 98765 00004',
    });
    summary.usersCreated.push(ngo.email);
  } else {
    let passwordMatches = false;
    try {
      passwordMatches = await ngo.comparePassword('Password123!');
    } catch (e) {
      passwordMatches = false;
    }
    if (!passwordMatches || ngo.accountStatus !== 'active') {
      ngo.accountStatus = 'active';
      ngo.password = 'Password123!';
      await ngo.save();
      summary.usersUpdated.push(ngo.email);
    }
  }

  // Ensure NGO Organization (Hope Shelter)
  let hopeShelter = await Organization.findOne({ owner: ngo._id });
  if (!hopeShelter) {
    hopeShelter = await Organization.create({
      owner: ngo._id,
      name: 'Hope Community Shelter & Kitchen',
      type: 'shelter',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      verifiedBy: admin._id,
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
        coordinates: [77.212, 28.643],
      },
      maxDailyCapacityServings: 150,
      currentDailyClaimedServings: 0,
      acceptedFoodCategories: ['prepared_meals', 'packaged_groceries', 'fruits_vegetables', 'bakery'],
      dietaryPreferences: ['vegetarian', 'vegan'],
      operatingHours: { open: '07:00', close: '22:00', daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      serviceRadiusKm: 15,
      hasRefrigeration: true,
      hasVehicle: true,
      contactPhone: '+91 98765 00004',
      contactEmail: 'ngo@foodloop.org',
      description: 'Serving hot, nutritious meals to shelter residents every evening.',
    });
    summary.orgsCreated.push(hopeShelter.name);
  }

  // 4. Ensure Demo Volunteer Account (Alex Courier)
  let volunteer = await User.findOne({ email: 'volunteer@foodloop.org' }).select('+password');
  if (!volunteer) {
    volunteer = await User.create({
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
          coordinates: [77.219, 28.625],
        },
        completedDeliveriesCount: 12,
      },
    });
    summary.usersCreated.push(volunteer.email);
  } else {
    let passwordMatches = false;
    try {
      passwordMatches = await volunteer.comparePassword('Password123!');
    } catch (e) {
      passwordMatches = false;
    }
    if (!passwordMatches || volunteer.accountStatus !== 'active') {
      volunteer.accountStatus = 'active';
      volunteer.password = 'Password123!';
      await volunteer.save();
      summary.usersUpdated.push(volunteer.email);
    }
  }

  // 5. Ensure Demo Unverified NGO Account (Eastside Pantry)
  let unverified = await User.findOne({ email: 'unverified@foodloop.org' }).select('+password');
  if (!unverified) {
    unverified = await User.create({
      name: 'Sunita Roy (Eastside Community Pantry)',
      email: 'unverified@foodloop.org',
      password: 'Password123!',
      role: 'recipient',
      accountStatus: 'pending',
      phone: '+91 98765 00006',
    });
    summary.usersCreated.push(unverified.email);
  } else {
    let passwordMatches = false;
    try {
      passwordMatches = await unverified.comparePassword('Password123!');
    } catch (e) {
      passwordMatches = false;
    }
    if (!passwordMatches) {
      unverified.password = 'Password123!';
      await unverified.save();
      summary.usersUpdated.push(unverified.email);
    }
  }

  // Ensure Eastside Pantry Organization
  let eastsidePantry = await Organization.findOne({ owner: unverified._id });
  if (!eastsidePantry) {
    eastsidePantry = await Organization.create({
      owner: unverified._id,
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
        coordinates: [77.277, 28.631],
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
    summary.orgsCreated.push(eastsidePantry.name);
  }

  console.log('[SystemInit]: System and demo accounts verification complete.', {
    created: summary.usersCreated.length,
    updated: summary.usersUpdated.length,
    orgsCreated: summary.orgsCreated.length,
  });

  return summary;
}

module.exports = { ensureSystemAccounts };
