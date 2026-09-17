import { describe, expect, it } from 'vitest';

import { buildAlertQuery } from './api';

describe('W3 alert query contract', () => {
  it('serializes backend-supported filters', () => {
    const query = new URLSearchParams(buildAlertQuery({
      page: 2,
      limit: 20,
      status: 'OPEN',
      severity: 'CRITICAL',
      driverId: '123e4567-e89b-12d3-a456-426614174000',
      assignedToUserId: '123e4567-e89b-12d3-a456-426614174001',
    }));
    expect(query.get('page')).toBe('2');
    expect(query.get('status')).toBe('OPEN');
    expect(query.get('severity')).toBe('CRITICAL');
    expect(query.get('driverId')).toContain('123e4567');
    expect(query.get('assignedToUserId')).toContain('123e4567');
  });

  it('normalizes valid local date values to ISO and ignores invalid values', () => {
    const valid = new URLSearchParams(buildAlertQuery({ page: 1, limit: 20, from: '2026-09-17T08:00' }));
    const invalid = new URLSearchParams(buildAlertQuery({ page: 1, limit: 20, from: 'not-a-date' }));
    expect(valid.get('from')).toMatch(/^2026-09-17T/);
    expect(invalid.has('from')).toBe(false);
  });
});
