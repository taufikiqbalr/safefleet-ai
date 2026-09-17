import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';
import { appConfig } from '../lib/config';
import { getAlertReferenceData, listAlerts } from './api';
import type { AlertFilters, AlertRecord, AlertReferenceData, PaginatedResult, RealtimeStatus } from './types';

type AttentionAlert = Pick<AlertRecord, 'id' | 'severity' | 'title'>;

type AlertCenterState = {
  queue: PaginatedResult<AlertRecord> | null;
  references: AlertReferenceData;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  realtimeStatus: RealtimeStatus;
  lastSynchronizedAt: Date | null;
  lastRealtimeEvent: string | null;
  attention: AttentionAlert | null;
};

const emptyReferences: AlertReferenceData = { drivers: [], vehicles: [], users: [] };

export function useAlertCenter(filters: AlertFilters) {
  const { session, logout } = useAuth();
  const [state, setState] = useState<AlertCenterState>({
    queue: null,
    references: emptyReferences,
    loading: true,
    refreshing: false,
    error: null,
    realtimeStatus: 'connecting',
    lastSynchronizedAt: null,
    lastRealtimeEvent: null,
    attention: null,
  });
  const mountedRef = useRef(true);
  const refreshRef = useRef<Promise<void> | null>(null);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const refresh = useCallback((signal?: AbortSignal): Promise<void> => {
    if (!session) return Promise.resolve();
    if (refreshRef.current) return refreshRef.current;

    const job = (async () => {
      setState((current) => ({
        ...current,
        loading: current.queue === null,
        refreshing: current.queue !== null,
        error: null,
      }));
      try {
        const [queue, references] = await Promise.all([
          listAlerts(session.accessToken, filters, signal),
          getAlertReferenceData(session.accessToken, session.user.role !== 'VIEWER', signal),
        ]);
        if (!mountedRef.current) return;
        setState((current) => ({
          ...current,
          queue,
          references,
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
          error: error instanceof Error ? error.message : 'Alert queue could not be loaded.',
        }));
      }
    })();

    refreshRef.current = job;
    void job.finally(() => {
      if (refreshRef.current === job) refreshRef.current = null;
    });
    return job;
  }, [filters, logout, session]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    let timer: number | null = null;

    const scheduleRefresh = (event: string) => {
      if (!active) return;
      setState((current) => ({ ...current, lastRealtimeEvent: event }));
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        void refresh();
      }, 300);
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

    socket.on('alert.created', (payload: Partial<AlertRecord>) => {
      if (payload.id && (payload.severity === 'CRITICAL' || payload.severity === 'WARNING')) {
        setState((current) => ({
          ...current,
          attention: {
            id: payload.id!,
            severity: payload.severity!,
            title: payload.title ?? 'New fleet safety alert',
          },
        }));
      }
      scheduleRefresh('alert.created');
    });
    socket.on('alert.updated', () => scheduleRefresh('alert.updated'));

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
  }, [refresh, session]);

  return {
    ...state,
    refresh,
    dismissAttention: () => setState((current) => ({ ...current, attention: null })),
  };
}
