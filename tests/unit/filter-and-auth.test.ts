import { describe, expect, it } from 'vitest';
import { candidateWhereFromFilters, offerWhereFromFilters } from '../../server/src/services/filter.js';
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../server/src/services/auth.js';

describe('filter builders', () => {
  it('builds candidate filter with cross criteria', () => {
    const where = candidateWhereFromFilters({
      skills: ['english', 'reception'],
      experienceMin: 2,
      position: 'Receptionist',
    });

    expect(where.AND).toHaveLength(4);
  });

  it('builds offer filter with status active and skills', () => {
    const where = offerWhereFromFilters({
      skills: ['cooking'],
      experienceMin: 1,
      position: 'Chef',
    });

    expect(where.AND).toHaveLength(4);
  });
});

describe('token helpers', () => {
  it('signs and verifies access token', () => {
    const token = signAccessToken({
      userId: 'user_1',
      role: 'CANDIDATE',
      email: 'candidate@test.local',
      sessionId: 'session_1',
    });

    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user_1');
    expect(payload.role).toBe('CANDIDATE');
  });

  it('signs and verifies refresh token', () => {
    const token = signRefreshToken({ userId: 'user_1', sessionId: 'session_1' });
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe('user_1');
    expect(payload.sessionId).toBe('session_1');
  });

  it('creates deterministic refresh hash', () => {
    const token = signRefreshToken({ userId: 'user_1', sessionId: 'session_1' });
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
  });
});
