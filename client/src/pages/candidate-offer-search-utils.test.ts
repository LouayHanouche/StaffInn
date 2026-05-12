import { describe, expect, it } from 'vitest';
import {
  mergeSkillSuggestions,
  normalizeSkillToken,
  normalizeSkillsQuery,
  toggleCommaSeparatedSkill,
} from './candidate-offer-search-utils';

describe('candidate offer search utils', () => {
  it('prioritizes candidate skills and removes case-insensitive duplicates', () => {
    expect(
      mergeSkillSuggestions(['English', 'Reception'], ['reception', 'PMS', 'english', 'service']),
    ).toEqual(['English', 'Reception', 'PMS', 'service']);
  });

  it('normalizes skill tokens for consistent comparisons', () => {
    expect(normalizeSkillToken('Customer Service')).toBe('customer service');
    expect(normalizeSkillToken('  night-shift ')).toBe('night-shift');
    expect(normalizeSkillToken('Service   Client')).toBe('service   client');
  });

  it('adds a missing skill to the comma-separated filter', () => {
    expect(toggleCommaSeparatedSkill('english, reception', 'PMS')).toBe('english, reception, PMS');
  });

  it('removes an existing skill from the comma-separated filter', () => {
    expect(toggleCommaSeparatedSkill('english, reception, PMS', 'reception')).toBe('english, PMS');
  });

  it('normalizes the skills query string into canonical tokens', () => {
    expect(normalizeSkillsQuery('Customer Service, night-shift, Service Client')).toBe(
      'customer service,night-shift,service client',
    );
  });
});
