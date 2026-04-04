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
    server = app.listen(4012, () => resolve());
  });
});

test.afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('hotel flow and admin moderation flow', async () => {
  const api = await playwrightRequest.newContext({
    baseURL: 'http://127.0.0.1:4012',
  });

  const hotelLogin = await api.post('/auth/login', {
    data: {
      email: 'hotel@test.local',
      password: 'HotelPass123',
    },
  });
  expect(hotelLogin.status()).toBe(200);
  const hotelToken = (await hotelLogin.json()).accessToken as string;

  const created = await api.post('/offers', {
    headers: {
      Authorization: `Bearer ${hotelToken}`,
    },
    data: {
      title: 'Playwright Offer',
      description: 'Offer created through API E2E flow for moderation.',
      requiredSkills: ['reception', 'customer-service'],
      requiredExperience: 2,
    },
  });
  expect(created.status()).toBe(201);
  const createdOffer = await created.json();

  const adminLogin = await api.post('/auth/login', {
    data: {
      email: 'admin@test.local',
      password: 'AdminPass123',
    },
  });
  expect(adminLogin.status()).toBe(200);
  const adminToken = (await adminLogin.json()).accessToken as string;

  const moderation = await api.put(`/admin/offers/${createdOffer.id}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    data: {
      action: 'approve',
    },
  });

  expect(moderation.status()).toBe(200);
  expect((await moderation.json()).offer.status).toBe('ACTIVE');
});
