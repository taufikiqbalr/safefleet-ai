import { describe, expect, it } from 'vitest';

import { canListUsersForSafetyReview, canReviewSafetyEvent } from './permissions';

describe('W4 safety review permissions', () => {
  it('allows backend-authorized review roles', () => {
    expect(canReviewSafetyEvent('OWNER')).toBe(true);
    expect(canReviewSafetyEvent('ADMIN')).toBe(true);
    expect(canReviewSafetyEvent('SUPERVISOR')).toBe(true);
    expect(canReviewSafetyEvent('ANALYST')).toBe(true);
  });

  it('keeps viewer feedback read-only', () => {
    expect(canReviewSafetyEvent('VIEWER')).toBe(false);
    expect(canListUsersForSafetyReview('VIEWER')).toBe(false);
    expect(canListUsersForSafetyReview('ANALYST')).toBe(true);
  });
});
