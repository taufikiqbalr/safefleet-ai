import { describe, expect, it } from 'vitest';

import { allowedAlertActions, canMutateAlerts } from './permissions';

describe('W3 alert permissions', () => {
  it('allows backend mutation roles only', () => {
    expect(canMutateAlerts('OWNER')).toBe(true);
    expect(canMutateAlerts('ADMIN')).toBe(true);
    expect(canMutateAlerts('SUPERVISOR')).toBe(true);
    expect(canMutateAlerts('ANALYST')).toBe(false);
    expect(canMutateAlerts('VIEWER')).toBe(false);
  });

  it('disables all lifecycle changes after resolution', () => {
    expect(allowedAlertActions('RESOLVED')).toEqual({
      assign: false,
      acknowledge: false,
      escalate: false,
      resolve: false,
    });
  });

  it('matches the current backend non-resolved transition contract', () => {
    expect(allowedAlertActions('OPEN')).toEqual({ assign: true, acknowledge: true, escalate: true, resolve: true });
    expect(allowedAlertActions('ACKNOWLEDGED').acknowledge).toBe(false);
    expect(allowedAlertActions('ESCALATED').escalate).toBe(false);
  });
});
