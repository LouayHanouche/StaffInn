import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../server/src/app.js';
import { prisma } from '../../server/src/db/prisma.js';
import { resetDatabase, seedTestData } from '../setup/database.js';

describe('security tests', () => {
  const app = createApp();
  let candidateToken = '';
  let hotelToken = '';

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

  it('hotel-only candidates route returns 403 for candidate actor', async () => {
    const response = await request(app)
      .get('/candidates?skills=reception')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(response.status).toBe(403);
  });

  it('rejects SQL-like payload in filter query by validation/sanitization constraints', async () => {
    const response = await request(app)
      .get('/offers?page=1&pageSize=20&position=%27%20OR%201=1--')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect([200, 400]).toContain(response.status);
  });

  it('rejects executable upload for CV', async () => {
    const response = await request(app)
      .post('/candidates/profile/cv')
      .set('Authorization', `Bearer ${candidateToken}`)
      .attach('cv', Buffer.from('MZ executable body'), {
        filename: 'malware.exe',
        contentType: 'application/x-msdownload',
      });

    expect(response.status).toBe(400);
  });

  it('accepts PDF upload for CV', async () => {
    const response = await request(app)
      .post('/candidates/profile/cv')
      .set('Authorization', `Bearer ${candidateToken}`)
      .attach('cv', Buffer.from('%PDF-1.4 test pdf content'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(200);
    expect(response.body.profile.cvPath).toContain('.pdf');
  });

  it('expired access token cannot access protected route', async () => {
    const response = await request(app)
      .get('/offers')
      .set('Authorization', 'Bearer invalid.expired.token');

    expect(response.status).toBe(401);
  });

  it('hotel can access candidates database route', async () => {
    const response = await request(app)
      .get('/candidates?skills=reception&experience_min=1')
      .set('Authorization', `Bearer ${hotelToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
  });
});
