import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ApiError, getCurrentOrganization, getCurrentUser, loginWithPassword } from '../lib/api';
import { clearStoredSession, createSession, readStoredSession, writeStoredSession } from './session';
import type { AuthSession, LoginPayload, UserRole } from './types';

type AuthStatus = 'bootstrapping' | 'unauthenticated' | 'authenticating' | 'authenticated' | 'unavailable';

type AuthState = {
  status: AuthStatus;
  session: AuthSession | null;
  error: string | null;
};

type AuthContextValue = AuthState & {
  login: (payload: LoginPayload) => Promise<void>;
  logout: (reason?: string) => void;
  retryBootstrap: () => Promise<void>;
  hasAnyRole: (roles: readonly UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function friendlyAuthError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Organization, email, or password is not valid.';
    if (error.status === 403) return 'This account is authenticated but is not allowed to perform that action.';
    return error.message;
  }
  if (error instanceof TypeError) return 'SafeFleet Backend is unreachable. Check the API URL and backend service.';
  return error instanceof Error ? error.message : 'Authentication failed.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'bootstrapping',
    session: null,
    error: null,
  });

  const logout = useCallback((reason?: string) => {
    clearStoredSession();
    setState({
      status: 'unauthenticated',
      session: null,
      error: reason ?? null,
    });
  }, []);

  const verifyStoredSession = useCallback(async (candidate: AuthSession) => {
    const [user, organization] = await Promise.all([
      getCurrentUser(candidate.accessToken),
      getCurrentOrganization(candidate.accessToken),
    ]);
    const verified: AuthSession = { ...candidate, user, organization };
    writeStoredSession(verified);
    setState({ status: 'authenticated', session: verified, error: null });
  }, []);

  const retryBootstrap = useCallback(async () => {
    const candidate = readStoredSession();
    if (!candidate) {
      setState({ status: 'unauthenticated', session: null, error: null });
      return;
    }

    setState({ status: 'bootstrapping', session: candidate, error: null });
    try {
      await verifyStoredSession(candidate);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout('Your SafeFleet session expired or is no longer valid. Please sign in again.');
        return;
      }
      setState({
        status: 'unavailable',
        session: candidate,
        error: friendlyAuthError(error),
      });
    }
  }, [logout, verifyStoredSession]);

  useEffect(() => {
    void retryBootstrap();
  }, [retryBootstrap]);

  useEffect(() => {
    if (state.status !== 'authenticated' || !state.session) return;
    const remainingMs = state.session.expiresAt - Date.now();
    if (remainingMs <= 0) {
      logout('Your SafeFleet session has expired. Please sign in again.');
      return;
    }

    const timer = window.setTimeout(() => {
      logout('Your SafeFleet session has expired. Please sign in again.');
    }, Math.min(remainingMs, 2_147_483_647));

    return () => window.clearTimeout(timer);
  }, [logout, state.session, state.status]);

  const login = useCallback(async (payload: LoginPayload) => {
    setState({ status: 'authenticating', session: null, error: null });
    try {
      const response = await loginWithPassword({
        organizationSlug: payload.organizationSlug.trim().toLowerCase(),
        email: payload.email.trim(),
        password: payload.password,
      });
      const [user, organization] = await Promise.all([
        getCurrentUser(response.accessToken),
        getCurrentOrganization(response.accessToken),
      ]);
      const session = createSession(response, user, organization);
      writeStoredSession(session);
      setState({ status: 'authenticated', session, error: null });
    } catch (error) {
      clearStoredSession();
      const message = friendlyAuthError(error);
      setState({ status: 'unauthenticated', session: null, error: message });
      throw new Error(message);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    login,
    logout,
    retryBootstrap,
    hasAnyRole: (roles) => Boolean(state.session && roles.includes(state.session.user.role)),
  }), [login, logout, retryBootstrap, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook and provider intentionally share this module so consumers use one session boundary.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
