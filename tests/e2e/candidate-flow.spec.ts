import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { Server } from 'node:http';
import { createApp } from '../../server/src/app.js';
import { resetDatabase, seedTestData } from '../setup/database.js';

let server: Server;

test.beforeAll(async () => {
  resetDatabase();
  await seedTestData();
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(4011, () => resolve());
  });
});

test.afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('candidate full flow: register -> profile -> upload CV -> apply', async () => {
  const api = await playwrightRequest.newContext({
    baseURL: 'http://127.0.0.1:4011',
  });

  const register = await api.post('/auth/register', {
    data: {
      role: 'CANDIDATE',
      email: 'flow-candidate@test.local',
      password: 'FlowPass123',
      fullName: 'Flow Candidate',
    },
  });
  expect(register.status()).toBe(201);
  const registerJson = await register.json();

  const updateProfile = await api.put('/candidates/profile', {
    headers: {
      Authorization: `Bearer ${registerJson.accessToken}`,
    },
    data: {
      fullName: 'Flow Candidate',
      position: 'Receptionist',
      experienceYears: 4,
      skills: ['reception', 'english'],
    },
  });
  expect(updateProfile.status()).toBe(200);

  const upload = await api.post('/candidates/profile/cv', {
    headers: {
      Authorization: `Bearer ${registerJson.accessToken}`,
    },
    multipart: {
      cv: {
        name: 'candidate.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 flow content'),
      },
    },
  });
  expect(upload.status()).toBe(200);

  const offers = await api.get('/offers', {
    headers: {
      Authorization: `Bearer ${registerJson.accessToken}`,
    },
    params: {
      page: '1',
      pageSize: '20',
      position: 'Reception',
      q: 'reception',
      sort: 'createdAt_desc',
    },
  });
  expect(offers.status()).toBe(200);
  const offerJson = await offers.json();

  const apply = await api.post(`/offers/${offerJson.items[0].id}/apply`, {
    headers: {
      Authorization: `Bearer ${registerJson.accessToken}`,
    },
    data: {
      coverLetter: 'I can start immediately.',
    },
  });

  expect(apply.status()).toBe(201);
});
