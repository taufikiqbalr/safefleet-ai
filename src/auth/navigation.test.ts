import { describe, expect, it } from 'vitest';

import { canAccessRoles, navigationForRole, ADMIN_ROLES, SUPERVISOR_MANAGEMENT_ROLES } from './navigation';

describe('W1 role-aware navigation', () => {
  it('shows administration routes to owner accounts', () => {
    const paths = navigationForRole('OWNER').map((item) => item.to);
    expect(paths).toContain('/drivers');
    expect(paths).toContain('/risk-policies');
    expect(paths).toContain('/settings');
  });

  it('keeps management routes out of analyst navigation', () => {
    const paths = navigationForRole('ANALYST').map((item) => item.to);
    expect(paths).toContain('/analytics');
    expect(paths).not.toContain('/drivers');
    expect(paths).not.toContain('/settings');
  });

  it('matches the management role boundaries used by route guards', () => {
    expect(canAccessRoles('SUPERVISOR', SUPERVISOR_MANAGEMENT_ROLES)).toBe(true);
    expect(canAccessRoles('SUPERVISOR', ADMIN_ROLES)).toBe(false);
    expect(canAccessRoles('ADMIN', ADMIN_ROLES)).toBe(true);
  });
});
