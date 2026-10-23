const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Donation = require('../models/Donation');
const DonationRequest = require('../models/DonationRequest');
const Organization = require('../models/Organization');
const Pickup = require('../models/Pickup');
const CodeService = require('../services/codeService');

describe('FoodLoop Security & Regression Tests', () => {
  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodloop';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('1. Health Check & Route Fallback', () => {
    test('GET /api/health returns 200 and healthy status when DB is connected', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
      expect(res.body.service).toContain('FoodLoop');
    });

    test('Unknown API routes return 404 JSON response instead of HTML', async () => {
      const res = await request(app).get('/api/some-nonexistent-endpoint-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('2. Authentication & Privilege Escalation Safeguards', () => {
    test('Registration with role: "admin" is blocked (Privilege Escalation Protection)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Hacker Admin',
        email: `escalation_test_${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'admin',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid registration role');
    });

    test('Registration requires valid email and password minlength', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Short Password User',
        email: 'invalid-email',
        password: '123',
        role: 'donor',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. CodeService Robustness & Buffer Safety', () => {
    test('CodeService.verifyCode handles mismatched hash lengths without throwing RangeError', () => {
      const validCode = '123456';
      expect(() => {
        const result = CodeService.verifyCode(validCode, 'too-short');
        expect(result).toBe(false);
      }).not.toThrow();

      expect(() => {
        const result = CodeService.verifyCode(validCode, 'a'.repeat(128));
        expect(result).toBe(false);
      }).not.toThrow();

      expect(CodeService.verifyCode(null, null)).toBe(false);
      expect(CodeService.verifyCode('', '')).toBe(false);
    });
  });

  describe('4. Duplicate Claim Prevention & Atomic Safeguards', () => {
    test('Prevents same organization from submitting duplicate pending claim for same donation', async () => {
      // Login as recipient NGO
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'ngo@foodloop.org',
        password: 'Password123!',
      });
      expect(loginRes.status).toBe(200);
      const ngoToken = loginRes.body.token;

      // Find an available donation
      const now = new Date();
      const donation = await Donation.create({
        donor: loginRes.body.user._id,
        donorType: 'restaurant',
        foodTitle: `Regression Test Food Batch ${Date.now()}`,
        category: 'prepared_meals',
        quantity: 30,
        remainingQuantity: 30,
        estimatedServings: 30,
        pinCode: '110001',
        dietaryClassification: ['vegetarian'],
        preparationTime: new Date(now.getTime() - 30 * 60 * 1000),
        collectionWindow: {
          startTime: now,
          deadline: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        },
        storageAndHandling: {
          storageType: 'hot_holding',
        },
        safetyDeclaration: {
          isSafeAndEdible: true,
          storedAtSafeTemperature: true,
          preparedWithCleanUtensils: true,
          declaredBy: 'Chef Tester',
        },
        pickupAddress: {
          formattedAddress: 'Connaught Place, New Delhi',
        },
        location: {
          type: 'Point',
          coordinates: [77.2197, 28.6328],
        },
        status: 'AVAILABLE',
      });

      // Submit first claim - should succeed
      const firstClaimRes = await request(app)
        .post(`/api/donations/${donation._id}/requests`)
        .set('Authorization', `Bearer ${ngoToken}`)
        .send({ requestedQuantity: 15 });

      expect(firstClaimRes.status).toBe(201);
      expect(firstClaimRes.body.success).toBe(true);

      // Submit second duplicate claim from same NGO - must be rejected
      const duplicateClaimRes = await request(app)
        .post(`/api/donations/${donation._id}/requests`)
        .set('Authorization', `Bearer ${ngoToken}`)
        .send({ requestedQuantity: 10 });

      expect(duplicateClaimRes.status).toBe(400);
      expect(duplicateClaimRes.body.success).toBe(false);
      expect(duplicateClaimRes.body.message).toContain('already has an active claim');

      // Cleanup test donation and request
      await DonationRequest.deleteMany({ donation: donation._id });
      await Donation.findByIdAndDelete(donation._id);
    });
  });
});
