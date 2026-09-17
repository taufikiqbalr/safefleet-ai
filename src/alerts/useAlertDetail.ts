import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';
import { appConfig } from '../lib/config';
import {
  acknowledgeAlert,
  assignAlert,
  escalateAlert,
  getAlertDetailBundle,
  resolveAlert,
} from './api';
import type { AlertDetailBundle, RealtimeStatus } from './types';

type MutationKind = 'assign' | 'unassign' | 'acknowledge' | 'escalate' | 'resolve';

type AlertDetailState = {
  bundle: AlertDetailBundle | null;
  loading: boolean;
  refreshing: boolean;
  actionPending: MutationKind | null;
  error: string | null;
  actionMessage: string | null;
  realtimeStatus: RealtimeStatus;
};

export function useAlertDetail(alertId: string) {
  const { session, logout } = useAuth();
  const [state, setState] = useState<AlertDetailState>({
    bundle: null,
    loading: true,
    refreshing: false,
    actionPending: null,
    error: null,
    actionMessage: null,
    realtimeStatus: 'connecting',
  });
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!session || !alertId) return;
    setState((current) => ({
      ...current,
      loading: current.bundle === null,
      refreshing: current.bundle !== null,
      error: null,
    }));
    try {
      const bundle = await getAlertDetailBundle(
        session.accessToken,
        alertId,
        session.user.role !== 'VIEWER',
        signal,
      );
      if (!mountedRef.current) return;
      setState((current) => ({
        ...current,
        bundle,
        loading: false,
        refreshing: false,
        error: null,
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (error instanceof ApiError && error.status === 401) {
        logout('Your SafeFleet session is no longer authorized. Please sign in again.');
        return;
      }
      if (!mountedRef.current) return;
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : 'Alert detail could not be loaded.',
      }));
    }
  }, [alertId, logout, session]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const mutate = useCallback(async (
    kind: MutationKind,
    options: { userId?: string | null; note?: string } = {},
  ) => {
    if (!session) return false;
    setState((current) => ({ ...current, actionPending: kind, actionMessage: null, error: null }));
    try {
      if (kind === 'assign') await assignAlert(session.accessToken, alertId, options.userId ?? null, options.note);
      if (kind === 'unassign') await assignAlert(session.accessToken, alertId, null, options.note);
      if (kind === 'acknowledge') await acknowledgeAlert(session.accessToken, alertId, options.note);
      if (kind === 'escalate') await escalateAlert(session.accessToken, alertId, options.note);
      if (kind === 'resolve') await resolveAlert(session.accessToken, alertId, options.note);
      await refresh();
      if (!mountedRef.current) return true;
      setState((current) => ({
        ...current,
        actionPending: null,
        actionMessage: `${kind.charAt(0).toUpperCase()}${kind.slice(1)} operation completed.`,
      }));
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout('Your SafeFleet session is no longer authorized. Please sign in again.');
        return false;
      }
      if (!mountedRef.current) return false;
      setState((current) => ({
        ...current,
        actionPending: null,
        error: error instanceof Error ? error.message : 'Alert operation failed.',
      }));
      return false;
    }
  }, [alertId, logout, refresh, session]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    let timer: number | null = null;
    const socket = io(`${appConfig.realtimeBaseUrl}/realtime`, {
      auth: { token: session.accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('session.ready', (payload: { organizationId?: string }) => {
      if (!active) return;
      if (payload.organizationId !== session.organization.id) {
        setState((current) => ({ ...current, realtimeStatus: 'disconnected', error: 'Realtime tenant context mismatch.' }));
        socket.disconnect();
        return;
      }
      setState((current) => ({ ...current, realtimeStatus: 'synchronizing' }));
      void refresh().finally(() => {
        if (active) setState((current) => ({ ...current, realtimeStatus: 'ready' }));
      });
    });

    socket.on('alert.updated', (payload: { id?: string }) => {
      if (!active || payload.id !== alertId) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        void refresh();
      }, 250);
    });
    socket.on('disconnect', (reason) => {
      if (!active) return;
      setState((current) => ({
        ...current,
        realtimeStatus: reason === 'io client disconnect' ? 'disconnected' : 'reconnecting',
      }));
    });
    socket.io.on('reconnect_attempt', () => {
      if (active) setState((current) => ({ ...current, realtimeStatus: 'reconnecting' }));
    });

    return () => {
      active = false;
      if (timer !== null) window.clearTimeout(timer);
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
    };
  }, [alertId, refresh, session]);

  return { ...state, refresh, mutate };
}
