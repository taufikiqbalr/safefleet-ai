import { describe, expect, it } from 'vitest';

import { createSession, parseStoredSession } from './session';
import type { AuthOrganization, AuthUser, LoginResponse } from './types';

const user: AuthUser = {
  id: 'user-1',
  email: 'owner@safefleet.local',
  fullName: 'SafeFleet Owner',
  role: 'OWNER',
  status: 'ACTIVE',
};

const organization: AuthOrganization = {
  id: 'org-1',
  name: 'SafeFleet Demo',
  slug: 'safefleet-demo',
  timezone: 'Asia/Jakarta',
};

const login: LoginResponse = {
  accessToken: 'a-valid-looking-access-token',
  tokenType: 'Bearer',
  expiresIn: 60,
  user,
  organization,
};

describe('W1 session persistence', () => {
  it('round-trips a valid tab session', () => {
    const session = createSession(login, user, organization, 1_000);
    const restored = parseStoredSession(JSON.stringify(session), 20_000);

    expect(restored?.accessToken).toBe(login.accessToken);
    expect(restored?.user.role).toBe('OWNER');
    expect(restored?.organization.slug).toBe('safefleet-demo');
  });

  it('rejects an expired session', () => {
    const session = createSession(login, user, organization, 1_000);
    expect(parseStoredSession(JSON.stringify(session), 61_001)).toBeNull();
  });

  it('rejects malformed role or token data', () => {
    expect(parseStoredSession('{"accessToken":"short"}', 1_000)).toBeNull();
    expect(parseStoredSession(JSON.stringify({
      ...createSession(login, user, organization, 1_000),
      user: { ...user, role: 'ROOT' },
    }), 2_000)).toBeNull();
  });
});
