import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';
import { appConfig } from '../lib/config';
import { getActiveAlerts, getDashboardSummary, getLiveFleet } from './api';
import type { ActiveAlertsResponse, DashboardSummary, LiveFleetResponse, RealtimeStatus } from './types';

const REALTIME_INVALIDATION_EVENTS = [
  'telemetry.location.updated',
  'safety.event.created',
  'risk.updated',
  'alert.created',
  'alert.updated',
  'sensor.reading.updated',
] as const;

type FleetOperationsState = {
  summary: DashboardSummary | null;
  liveFleet: LiveFleetResponse | null;
  activeAlerts: ActiveAlertsResponse | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  realtimeStatus: RealtimeStatus;
  lastSynchronizedAt: Date | null;
  lastRealtimeEvent: string | null;
};

const initialState: FleetOperationsState = {
  summary: null,
  liveFleet: null,
  activeAlerts: null,
  loading: true,
  refreshing: false,
  error: null,
  realtimeStatus: 'connecting',
  lastSynchronizedAt: null,
  lastRealtimeEvent: null,
};

export function useFleetOperations() {
  const { session, logout } = useAuth();
  const [state, setState] = useState(initialState);
  const mountedRef = useRef(true);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const refresh = useCallback((signal?: AbortSignal): Promise<void> => {
    if (!session) return Promise.resolve();
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const job = (async () => {
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          loading: current.summary === null,
          refreshing: current.summary !== null,
          error: null,
        }));
      }

      try {
        const [summary, liveFleet, activeAlerts] = await Promise.all([
          getDashboardSummary(session.accessToken, signal),
          getLiveFleet(session.accessToken, { staleAfterSeconds: 120 }, signal),
          getActiveAlerts(session.accessToken, { limit: 25 }, signal),
        ]);
        if (!mountedRef.current) return;
        setState((current) => ({
          ...current,
          summary,
          liveFleet,
          activeAlerts,
          loading: false,
          refreshing: false,
          error: null,
          lastSynchronizedAt: new Date(),
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
          error: error instanceof Error ? error.message : 'Fleet operations data could not be loaded.',
        }));
      }
    })();

    refreshPromiseRef.current = job;
    void job.finally(() => {
      if (refreshPromiseRef.current === job) refreshPromiseRef.current = null;
    });
    return job;
  }, [logout, session]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    let refreshTimer: number | null = null;

    const scheduleRefresh = (event: string) => {
      if (!active) return;
      setState((current) => ({ ...current, lastRealtimeEvent: event }));
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      const delay = event === 'telemetry.location.updated' ? 1200 : 450;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        void refresh();
      }, delay);
    };

    const socket = io(`${appConfig.realtimeBaseUrl}/realtime`, {
      auth: { token: session.accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 750,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      if (active) setState((current) => ({ ...current, realtimeStatus: 'connecting' }));
    });

    socket.on('session.ready', (payload: { organizationId?: string }) => {
      if (!active) return;
      if (payload.organizationId !== session.organization.id) {
        setState((current) => ({
          ...current,
          realtimeStatus: 'disconnected',
          error: 'Realtime tenant context did not match the authenticated organization.',
        }));
        socket.disconnect();
        return;
      }
      setState((current) => ({ ...current, realtimeStatus: 'synchronizing' }));
      void refresh().finally(() => {
        if (active) setState((current) => ({ ...current, realtimeStatus: 'ready' }));
      });
    });

    for (const event of REALTIME_INVALIDATION_EVENTS) {
      socket.on(event, () => scheduleRefresh(event));
    }

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

    socket.io.on('reconnect_error', () => {
      if (active) setState((current) => ({ ...current, realtimeStatus: 'reconnecting' }));
    });

    return () => {
      active = false;
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
    };
  }, [refresh, session]);

  return { ...state, refresh };
}
