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

  it('accepts CORS preflight from localhost alias origin', async () => {
    const response = await request(app)
      .options('/auth/register')
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects CORS preflight from unrelated origin', async () => {
    const response = await request(app)
      .options('/auth/register')
      .set('Origin', 'http://evil.example')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects weak password with validation details', async () => {
    const response = await request(app).post('/auth/register').send({
      role: 'CANDIDATE',
      email: 'weak-password@test.local',
      password: 'abcdefghij',
      fullName: 'Weak Password User',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid register payload');
    expect(response.body.errors?.fieldErrors?.password).toEqual(
      expect.arrayContaining([
        'Password must include at least one uppercase letter',
        'Password must include at least one number',
      ]),
    );
  });

  it('rejects candidate fullName that becomes too short after trim', async () => {
    const response = await request(app).post('/auth/register').send({
      role: 'CANDIDATE',
      email: 'short-name@test.local',
      password: 'StrongPass123',
      fullName: ' A ',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid register payload');
    expect(response.body.errors?.fieldErrors?.fullName).toEqual(
      expect.arrayContaining(['String must contain at least 2 character(s)']),
    );
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

  it('returns Compte suspendu for suspended account login', async () => {
    await prisma.user.update({
      where: { email: 'candidate@test.local' },
      data: { isActive: false },
    });

    const response = await request(app).post('/auth/login').send({
      email: 'candidate@test.local',
      password: 'CandidatePass123',
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Compte suspendu');
  });
});
