import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, getCurrentUser } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('W1 authenticated API client', () => {
  it('injects the bearer authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'user-1',
      email: 'owner@safefleet.local',
      fullName: 'SafeFleet Owner',
      role: 'OWNER',
      status: 'ACTIVE',
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await getCurrentUser('jwt-token-value');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer jwt-token-value');
  });

  it('exposes backend status for unauthorized responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      statusCode: 401,
      message: 'Unauthorized',
    }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })));

    await expect(getCurrentUser('expired-token')).rejects.toMatchObject<ApiError>({
      status: 401,
      message: 'Unauthorized',
    });
  });
});
