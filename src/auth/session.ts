import type { AuthOrganization, AuthSession, AuthUser, LoginResponse } from './types';
import { isUserRole } from './types';

export const SESSION_STORAGE_KEY = 'safefleet.auth.session.v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAuthUser(value: unknown): value is AuthUser {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.email === 'string'
    && typeof value.fullName === 'string'
    && isUserRole(value.role)
    && typeof value.status === 'string';
}

function isOrganization(value: unknown): value is AuthOrganization {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.slug === 'string'
    && typeof value.timezone === 'string';
}

export function createSession(
  login: LoginResponse,
  user: AuthUser,
  organization: AuthOrganization,
  now = Date.now(),
): AuthSession {
  return {
    accessToken: login.accessToken,
    tokenType: login.tokenType || 'Bearer',
    expiresAt: now + login.expiresIn * 1000,
    user,
    organization,
  };
}

export function parseStoredSession(raw: string | null, now = Date.now()): AuthSession | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (typeof parsed.accessToken !== 'string' || parsed.accessToken.length < 10) return null;
    if (typeof parsed.tokenType !== 'string') return null;
    if (typeof parsed.expiresAt !== 'number' || !Number.isFinite(parsed.expiresAt)) return null;
    if (parsed.expiresAt <= now) return null;
    if (!isAuthUser(parsed.user) || !isOrganization(parsed.organization)) return null;

    return parsed as AuthSession;
  } catch {
    return null;
  }
}

export function readStoredSession(storage: Storage = window.sessionStorage): AuthSession | null {
  const raw = storage.getItem(SESSION_STORAGE_KEY);
  const session = parseStoredSession(raw);
  if (!session && raw) storage.removeItem(SESSION_STORAGE_KEY);
  return session;
}

export function writeStoredSession(session: AuthSession, storage: Storage = window.sessionStorage) {
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(storage: Storage = window.sessionStorage) {
  storage.removeItem(SESSION_STORAGE_KEY);
}
