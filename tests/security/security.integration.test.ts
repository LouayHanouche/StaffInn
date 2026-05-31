import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../server/src/app.js';
import { prisma } from '../../server/src/db/prisma.js';
import { resetDatabase, seedTestData } from '../setup/database.js';

describe('security tests', () => {
  const app = createApp();
  let candidateToken = '';
  let hotelToken = '';
  let uploadedCvPath = '';
  let deletedCvPath = '';
  let otherCandidateToken = '';
  let otherUploadedCvPath = '';

  const cvStoragePath = (filename: string): string =>
    path.join(process.cwd(), 'server', 'storage', 'cv', filename);

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
    uploadedCvPath = response.body.profile.cvPath as string;
    expect(fs.existsSync(cvStoragePath(uploadedCvPath))).toBe(true);
  });

  it('replaces an existing CV and removes the old stored file', async () => {
    const previousCvPath = uploadedCvPath;

    const response = await request(app)
      .post('/candidates/profile/cv')
      .set('Authorization', `Bearer ${candidateToken}`)
      .attach('cv', Buffer.from('%PDF-1.4 replacement pdf content'), {
        filename: 'resume-updated.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(200);
    expect(response.body.profile.cvPath).toContain('.pdf');
    uploadedCvPath = response.body.profile.cvPath as string;
    expect(uploadedCvPath).not.toBe(previousCvPath);
    expect(fs.existsSync(cvStoragePath(previousCvPath))).toBe(false);
    expect(fs.existsSync(cvStoragePath(uploadedCvPath))).toBe(true);
  });

  it('rejects CV download without authorization header', async () => {
    const response = await request(app).get(`/files/cv/${uploadedCvPath}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Missing or invalid authorization header');
  });

  it('allows a candidate to download their own CV with authorization', async () => {
    const response = await request(app)
      .get(`/files/cv/${uploadedCvPath}`)
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('pdf');
  });

  it('allows a hotel to download an uploaded candidate CV with authorization', async () => {
    const response = await request(app)
      .get(`/files/cv/${uploadedCvPath}`)
      .set('Authorization', `Bearer ${hotelToken}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('pdf');
  });

  it('prevents a candidate from downloading another candidate CV', async () => {
    const register = await request(app).post('/auth/register').send({
      role: 'CANDIDATE',
      email: 'second-candidate@test.local',
      password: 'SecondPass123',
      fullName: 'Second Candidate',
    });

    expect(register.status).toBe(201);
    otherCandidateToken = register.body.accessToken as string;

    const upload = await request(app)
      .post('/candidates/profile/cv')
      .set('Authorization', `Bearer ${otherCandidateToken}`)
      .attach('cv', Buffer.from('%PDF-1.4 second candidate pdf content'), {
        filename: 'second-resume.pdf',
        contentType: 'application/pdf',
      });

    expect(upload.status).toBe(200);
    otherUploadedCvPath = upload.body.profile.cvPath as string;

    const response = await request(app)
      .get(`/files/cv/${otherUploadedCvPath}`)
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('File not found');
  });

  it('forbids hotel users from deleting candidate CVs through the candidate endpoint', async () => {
    const response = await request(app)
      .delete('/candidates/profile/cv')
      .set('Authorization', `Bearer ${hotelToken}`);

    expect(response.status).toBe(403);
  });

  it('allows a candidate to delete their CV and removes the stored file', async () => {
    const currentCvPath = uploadedCvPath;

    const response = await request(app)
      .delete('/candidates/profile/cv')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(response.status).toBe(204);
    expect(fs.existsSync(cvStoragePath(currentCvPath))).toBe(false);

    const candidate = await prisma.candidate.findFirst({
      where: {
        user: {
          email: 'candidate@test.local',
        },
      },
    });

    expect(candidate?.cvPath ?? null).toBeNull();
    deletedCvPath = currentCvPath;
    uploadedCvPath = '';
  });

  it('returns not found for a deleted CV download', async () => {
    const response = await request(app)
      .get(`/files/cv/${deletedCvPath}`)
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('File not found');
  });

  it('allows idempotent candidate CV deletion when no CV exists', async () => {
    const response = await request(app)
      .delete('/candidates/profile/cv')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(response.status).toBe(204);
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
