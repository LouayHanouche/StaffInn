import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../server/src/app.js';
import { prisma } from '../../server/src/db/prisma.js';
import { resetDatabase, seedTestData } from '../setup/database.js';

describe('auth routes', () => {
  const app = createApp();

  beforeAll(async () => {
    resetDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers candidate and returns access token', async () => {
    const response = await request(app).post('/auth/register').send({
      role: 'CANDIDATE',
      email: 'new-candidate@test.local',
      password: 'StrongPass123',
      fullName: 'New Candidate',
    });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeTruthy();
  });

  it('login -> me -> refresh -> logout flow', async () => {
    const login = await request(app).post('/auth/login').send({
      email: 'candidate@test.local',
      password: 'CandidatePass123',
    });

    expect(login.status).toBe(200);
    const accessToken = login.body.accessToken as string;
    const cookies = login.headers['set-cookie'];
    expect(cookies?.length).toBeGreaterThan(0);
    const refreshCookie = cookies?.[0];
    if (!refreshCookie) {
      throw new Error('Missing refresh cookie in login response');
    }
    expect(refreshCookie).toContain('staffinn_refresh_token=');

    const me = await request(app).get('/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('candidate@test.local');

    const refreshed = await request(app).post('/auth/refresh').set('Cookie', refreshCookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeTruthy();

    const logout = await request(app).post('/auth/logout').set('Cookie', refreshCookie);
    expect(logout.status).toBe(204);
  });
});
