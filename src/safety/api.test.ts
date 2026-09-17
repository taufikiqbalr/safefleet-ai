import { describe, expect, it } from 'vitest';

import { buildSafetyEventQuery, normalizeDateFilter } from './api';

describe('W4 safety event query', () => {
  it('serializes backend-supported filters and pagination', () => {
    const query = new URLSearchParams(buildSafetyEventQuery({
      page: 2,
      limit: 50,
      eventType: 'DROWSINESS',
      severity: 'HIGH',
      deviceId: '11111111-1111-4111-8111-111111111111',
      tripId: '22222222-2222-4222-8222-222222222222',
      driverId: '33333333-3333-4333-8333-333333333333',
      vehicleId: '44444444-4444-4444-8444-444444444444',
      from: '2026-09-01',
      to: '2026-09-17',
    }));

    expect(query.get('page')).toBe('2');
    expect(query.get('limit')).toBe('50');
    expect(query.get('eventType')).toBe('DROWSINESS');
    expect(query.get('severity')).toBe('HIGH');
    expect(query.get('deviceId')).toContain('11111111');
    expect(query.get('tripId')).toContain('22222222');
    expect(query.get('driverId')).toContain('33333333');
    expect(query.get('vehicleId')).toContain('44444444');
    expect(Date.parse(query.get('from') ?? '')).not.toBeNaN();
    expect(Date.parse(query.get('to') ?? '')).not.toBeNaN();
  });

  it('omits invalid date filters', () => {
    const query = new URLSearchParams(buildSafetyEventQuery({ page: 1, limit: 20, from: 'not-a-date', to: 'also-bad' }));
    expect(query.has('from')).toBe(false);
    expect(query.has('to')).toBe(false);
  });
});

describe('normalizeDateFilter', () => {
  it('creates an ISO timestamp for a valid date-only input', () => {
    const value = normalizeDateFilter('2026-09-17');
    expect(value).toBeTruthy();
    expect(Number.isNaN(Date.parse(value ?? ''))).toBe(false);
  });
});
