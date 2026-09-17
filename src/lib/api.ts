import type { AuthOrganization, AuthUser, LoginPayload, LoginResponse } from '../auth/types';
import { appConfig } from './config';

export type BackendHealth = {
  status: 'checking' | 'reachable' | 'unreachable';
  detail: string;
  checkedAt: Date | null;
};

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function endpoint(path: string): string {
  return `${appConfig.apiBaseUrl}/${path.replace(/^\/+/, '')}`;
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const candidate = body as ApiErrorBody;
    if (Array.isArray(candidate.message)) return candidate.message.join(', ');
    if (typeof candidate.message === 'string' && candidate.message.trim()) return candidate.message;
    if (typeof candidate.error === 'string' && candidate.error.trim()) return candidate.error;
  }
  return `Backend returned HTTP ${status}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return response.text().catch(() => null);
  return response.json().catch(() => null);
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(endpoint(path), { ...init, headers });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(errorMessage(body, response.status), response.status, body);
  }

  return body as T;
}

export async function loginWithPassword(payload: LoginPayload, signal?: AbortSignal): Promise<LoginResponse> {
  return requestJson<LoginResponse>(
    'auth/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    },
  );
}

export async function getCurrentUser(token: string, signal?: AbortSignal): Promise<AuthUser> {
  return requestJson<AuthUser>('auth/me', { method: 'GET', signal }, token);
}

export async function getCurrentOrganization(
  token: string,
  signal?: AbortSignal,
): Promise<AuthOrganization> {
  return requestJson<AuthOrganization>('organizations/current', { method: 'GET', signal }, token);
}

export async function changePassword(
  token: string,
  payload: { currentPassword: string; newPassword: string },
  signal?: AbortSignal,
): Promise<{ changed: boolean }> {
  return requestJson<{ changed: boolean }>(
    'auth/change-password',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    },
    token,
  );
}

export async function checkBackendHealth(signal?: AbortSignal): Promise<BackendHealth> {
  try {
    const response = await fetch(endpoint('health/live'), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      return {
        status: 'unreachable',
        detail: `Backend returned HTTP ${response.status}`,
        checkedAt: new Date(),
      };
    }

    return {
      status: 'reachable',
      detail: 'Backend liveness endpoint responded successfully',
      checkedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    return {
      status: 'unreachable',
      detail: error instanceof Error ? error.message : 'Backend request failed',
      checkedAt: new Date(),
    };
  }
}
