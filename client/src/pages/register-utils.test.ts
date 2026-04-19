import { describe, expect, it } from 'vitest';
import { ApiError } from '../lib/api';
import {
  extractRegisterErrors,
  isApiErrorLike,
  normalizeRegisterPayload,
  validateRegisterPayload,
} from './register-utils';

describe('register utils', () => {
  it('normalizes fields based on selected role', () => {
    const candidate = normalizeRegisterPayload({
      role: 'CANDIDATE',
      email: ' candidate@test.local ',
      password: 'StrongPass123',
      fullName: ' Jane Doe ',
      hotelName: ' Should be dropped ',
    });

    expect(candidate.email).toBe('candidate@test.local');
    expect(candidate.fullName).toBe('Jane Doe');
    expect(candidate.hotelName).toBeUndefined();
  });

  it('returns password and role-based field validation errors', () => {
    const errors = validateRegisterPayload({
      role: 'CANDIDATE',
      email: 'invalid-email',
      password: 'abcdefghij',
      fullName: 'A',
    });

    expect(errors.email).toBe('Adresse email invalide.');
    expect(errors.password).toBe(
      'Le mot de passe doit inclure une majuscule, une minuscule et un chiffre.',
    );
    expect(errors.fullName).toBe('Le nom complet doit contenir entre 2 et 150 caractères.');
  });

  it('extracts server field errors from flattened details', () => {
    const extracted = extractRegisterErrors({
      formErrors: [],
      fieldErrors: {
        email: ['Adresse email invalide.'],
        password: ['Password must include at least one uppercase letter'],
      },
    });

    expect(extracted).toEqual({
      email: 'Adresse email invalide.',
      password: 'Password must include at least one uppercase letter',
    });
  });

  it('detects ApiError instances and ApiError-like objects', () => {
    const apiError = new ApiError(400, 'Invalid register payload', {
      fieldErrors: { password: ['invalid'] },
    });

    expect(isApiErrorLike(apiError)).toBe(true);
    expect(
      isApiErrorLike({ message: 'Invalid register payload', details: { fieldErrors: {} } }),
    ).toBe(true);
    expect(isApiErrorLike({ message: 'Network Error' })).toBe(false);
    expect(isApiErrorLike(new TypeError('Failed to fetch'))).toBe(false);
    expect(isApiErrorLike({})).toBe(false);
    expect(isApiErrorLike('error')).toBe(false);
  });
});
