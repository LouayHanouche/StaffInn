import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../server/src/app.js';
import { prisma } from '../../server/src/db/prisma.js';
import { resetDatabase, seedTestData } from '../setup/database.js';

describe('offers and role-based access', () => {
  const app = createApp();
  let candidateToken = '';
  let hotelToken = '';
  let offerId = '';

  beforeAll(async () => {
    resetDatabase();
    await seedTestData();

    const candidateLogin = await request(app).post('/auth/login').send({
      email: 'candidate@test.local',
      password: 'CandidatePass123',
    });
    candidateToken = candidateLogin.body.accessToken;

    const hotelLogin = await request(app).post('/auth/login').send({
      email: 'hotel@test.local',
      password: 'HotelPass123',
    });
    hotelToken = hotelLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects candidate from creating offer', async () => {
    const response = await request(app)
      .post('/offers')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        title: 'Forbidden create',
        description: 'Candidates should never create offers in this system.',
        requiredSkills: ['communication'],
        requiredExperience: 1,
      });

    expect(response.status).toBe(403);
  });

  it('hotel creates offer, admin can moderate', async () => {
    const created = await request(app)
      .post('/offers')
      .set('Authorization', `Bearer ${hotelToken}`)
      .send({
        title: 'Night Receptionist',
        description: 'Coordinate check-ins and check-outs overnight for hotel guests.',
        requiredSkills: ['reception', 'english'],
        requiredExperience: 2,
      });

    expect(created.status).toBe(201);
    offerId = created.body.id;

    const adminLogin = await request(app).post('/auth/login').send({
      email: 'admin@test.local',
      password: 'AdminPass123',
    });

    const moderated = await request(app)
      .put(`/admin/offers/${offerId}`)
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .send({ action: 'approve' });

    expect(moderated.status).toBe(200);
    expect(moderated.body.offer.status).toBe('ACTIVE');
  });

  it('candidate can browse and apply to active offer', async () => {
    const offers = await request(app)
      .get('/offers?page=1&pageSize=20&skills=reception&experience_min=1&position=Reception')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(offers.status).toBe(200);
    expect(offers.body.items.length).toBeGreaterThan(0);

    const apply = await request(app)
      .post(`/offers/${offerId}/apply`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ coverLetter: 'I have relevant hospitality experience.' });

    expect(apply.status).toBe(201);
  });

  it('hotel can view applications across its offers', async () => {
    const response = await request(app)
      .get('/hotel/applications')
      .set('Authorization', `Bearer ${hotelToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
    const first = response.body.items[0];
    expect(first.jobOffer.title).toBeDefined();
    expect(first.candidate.email).toBeDefined();
  });
});
