import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../server/src/app.js';
import { prisma } from '../../server/src/db/prisma.js';
import { resetDatabase, seedTestData } from '../setup/database.js';

describe('admin routes', () => {
  const app = createApp();
  let adminToken: string;
  let hotelToken: string;
  let candidateToken: string;
  let testOfferId: string;
  let testCandidateId: string;
  let testHotelUserId: string;

  beforeAll(async () => {
    resetDatabase();
    await seedTestData();

    // Login as admin
    const adminLogin = await request(app).post('/auth/login').send({
      email: 'admin@test.local',
      password: 'AdminPass123',
    });
    adminToken = adminLogin.body.accessToken as string;

    // Login as hotel
    const hotelLogin = await request(app).post('/auth/login').send({
      email: 'hotel@test.local',
      password: 'HotelPass123',
    });
    hotelToken = hotelLogin.body.accessToken as string;

    // Login as candidate
    const candidateLogin = await request(app).post('/auth/login').send({
      email: 'candidate@test.local',
      password: 'CandidatePass123',
    });
    candidateToken = candidateLogin.body.accessToken as string;

    // Get test offer ID
    const offer = await prisma.jobOffer.findFirst();
    if (offer) {
      testOfferId = offer.id;
    }

    // Get test candidate ID
    const candidate = await prisma.user.findFirst({ where: { role: 'CANDIDATE' } });
    if (candidate) {
      testCandidateId = candidate.id;
    }

    // Get test hotel user ID
    const hotelUser = await prisma.user.findFirst({ where: { role: 'HOTEL' } });
    if (hotelUser) {
      testHotelUserId = hotelUser.id;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /admin/users', () => {
    it('creates a new candidate user', async () => {
      const response = await request(app)
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'CANDIDATE',
          email: 'new-admin-created-candidate@test.local',
          password: 'StrongPass123',
          fullName: 'Admin Created Candidate',
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('new-admin-created-candidate@test.local');
      expect(response.body.user.role).toBe('CANDIDATE');
    });

    it('creates a new hotel user', async () => {
      const response = await request(app)
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'HOTEL',
          email: 'new-admin-created-hotel@test.local',
          password: 'StrongPass123',
          hotelName: 'Admin Created Hotel',
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('new-admin-created-hotel@test.local');
      expect(response.body.user.role).toBe('HOTEL');
    });

    it('rejects non-admin access', async () => {
      const response = await request(app)
        .post('/admin/users')
        .set('Authorization', `Bearer ${hotelToken}`)
        .send({
          role: 'CANDIDATE',
          email: 'should-fail@test.local',
          password: 'StrongPass123',
          fullName: 'Should Fail',
        });

      expect(response.status).toBe(403);
    });

    it('rejects missing fullName for CANDIDATE role', async () => {
      const response = await request(app)
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'CANDIDATE',
          email: 'missing-name@test.local',
          password: 'StrongPass123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /admin/users/:id/profile', () => {
    it('updates candidate profile', async () => {
      const response = await request(app)
        .patch(`/admin/users/${testCandidateId}/profile`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Updated Candidate Name',
          position: 'Senior Receptionist',
          experienceYears: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.profile.fullName).toBe('Updated Candidate Name');
      expect(response.body.profile.position).toBe('Senior Receptionist');
      expect(response.body.profile.experienceYears).toBe(5);
    });

    it('updates hotel profile', async () => {
      const response = await request(app)
        .patch(`/admin/users/${testHotelUserId}/profile`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Hotel Name',
          address: 'New Address, Rabat',
        });

      expect(response.status).toBe(200);
      expect(response.body.profile.name).toBe('Updated Hotel Name');
      expect(response.body.profile.address).toBe('New Address, Rabat');
    });

    it('rejects non-admin access', async () => {
      const response = await request(app)
        .patch(`/admin/users/${testCandidateId}/profile`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          fullName: 'Hacker Attempt',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /admin/offers/:id with moderation reason', () => {
    it('approves offer with reason and creates moderation decision', async () => {
      // First create a pending offer
      const hotel = await prisma.hotel.findFirst();
      if (!hotel) {
        throw new Error('No hotel found for test');
      }

      const pendingOffer = await prisma.jobOffer.create({
        data: {
          hotelId: hotel.id,
          title: 'Test Pending Offer',
          description: 'Test description for pending offer',
          requiredSkills: 'test,skills',
          requiredExperience: 1,
          status: 'PENDING',
        },
      });

      const response = await request(app)
        .put(`/admin/offers/${pendingOffer.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'approve',
          reason: 'Good quality offer, meets all requirements',
        });

      expect(response.status).toBe(200);
      expect(response.body.offer.status).toBe('ACTIVE');

      // Verify moderation decision was created
      const decision = await prisma.moderationDecision.findFirst({
        where: { offerId: pendingOffer.id },
      });
      expect(decision).toBeTruthy();
      expect(decision?.action).toBe('approve');
      expect(decision?.reason).toBe('Good quality offer, meets all requirements');
    });

    it('rejects offer with reason', async () => {
      const hotel = await prisma.hotel.findFirst();
      if (!hotel) {
        throw new Error('No hotel found for test');
      }

      const pendingOffer = await prisma.jobOffer.create({
        data: {
          hotelId: hotel.id,
          title: 'Test Reject Offer',
          description: 'This offer should be rejected',
          requiredSkills: 'test',
          requiredExperience: 0,
          status: 'PENDING',
        },
      });

      const response = await request(app)
        .put(`/admin/offers/${pendingOffer.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'reject',
          reason: 'Description too vague, needs more details',
        });

      expect(response.status).toBe(200);
      expect(response.body.offer.status).toBe('CLOSED');

      const decision = await prisma.moderationDecision.findFirst({
        where: { offerId: pendingOffer.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(decision?.action).toBe('reject');
      expect(decision?.reason).toBe('Description too vague, needs more details');
    });
  });

  describe('GET /admin/offers/:id/moderation-history', () => {
    it('returns moderation history for offer', async () => {
      // Use an offer that has moderation decisions from previous tests
      const offerWithDecision = await prisma.jobOffer.findFirst({
        where: {
          moderationDecisions: {
            some: {},
          },
        },
      });

      if (!offerWithDecision) {
        // Create one if none exists
        const hotel = await prisma.hotel.findFirst();
        if (!hotel) {
          throw new Error('No hotel found');
        }

        const offer = await prisma.jobOffer.create({
          data: {
            hotelId: hotel.id,
            title: 'Offer With History',
            description: 'Test offer with moderation history',
            requiredSkills: 'test',
            requiredExperience: 1,
            status: 'PENDING',
          },
        });

        // Approve it to create a decision
        await request(app)
          .put(`/admin/offers/${offer.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ action: 'approve', reason: 'Approved for history test' });

        const response = await request(app)
          .get(`/admin/offers/${offer.id}/moderation-history`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.items)).toBe(true);
        expect(response.body.items.length).toBeGreaterThan(0);
      } else {
        const response = await request(app)
          .get(`/admin/offers/${offerWithDecision.id}/moderation-history`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.items)).toBe(true);
      }
    });
  });

  describe('Report endpoints', () => {
    let reportId: string;

    it('POST /admin/reports creates a report', async () => {
      const response = await request(app)
        .post('/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetType: 'OFFER',
          targetId: testOfferId,
          reason: 'This offer contains misleading information',
        });

      expect(response.status).toBe(201);
      expect(response.body.report.targetType).toBe('OFFER');
      expect(response.body.report.status).toBe('PENDING');
      reportId = response.body.report.id;
    });

    it('GET /admin/reports returns reports with pagination', async () => {
      const response = await request(app)
        .get('/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.pagination).toBeTruthy();
    });

    it('GET /admin/reports filters by status', async () => {
      const response = await request(app)
        .get('/admin/reports?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
      response.body.items.forEach((report: { status: string }) => {
        expect(report.status).toBe('PENDING');
      });
    });

    it('PATCH /admin/reports/:id updates report status', async () => {
      const response = await request(app)
        .patch(`/admin/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESOLVED',
          resolution: 'Verified and action taken against the offer',
        });

      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe('RESOLVED');
      expect(response.body.report.resolution).toBe('Verified and action taken against the offer');
    });

    it('rejects non-admin access to reports', async () => {
      const response = await request(app)
        .get('/admin/reports')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(response.status).toBe(403);
    });
  });
});
