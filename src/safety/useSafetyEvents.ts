import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';
import { appConfig } from '../lib/config';
import {
  getReviewStateByEventId,
  getSafetyReferenceData,
  listSafetyEvents,
} from './api';
import type { SafetyEventFilters, SafetyEventListState } from './types';

const initialFilters: SafetyEventFilters = {
  page: 1,
  limit: 20,
};

const initialState: SafetyEventListState = {
  result: null,
  references: null,
  reviewStateByEventId: {},
  loading: true,
  refreshing: false,
  error: null,
  realtimeStatus: 'connecting',
  lastSynchronizedAt: null,
};

export function useSafetyEvents() {
  const { session, logout } = useAuth();
  const [filters, setFiltersState] = useState<SafetyEventFilters>(initialFilters);
  const [state, setState] = useState<SafetyEventListState>(initialState);
  const mountedRef = useRef(true);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const refresh = useCallback((signal?: AbortSignal): Promise<void> => {
    if (!session) return Promise.resolve();
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const job = (async () => {
      setState((current) => ({
        ...current,
        loading: current.result === null,
        refreshing: current.result !== null,
        error: null,
      }));

      try {
        const [result, references] = await Promise.all([
          listSafetyEvents(session.accessToken, filters, signal),
          getSafetyReferenceData(session.accessToken, false, signal),
        ]);
        const reviewStateByEventId = await getReviewStateByEventId(session.accessToken, result.items, signal);
        if (!mountedRef.current) return;
        setState((current) => ({
          ...current,
          result,
          references,
          reviewStateByEventId,
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
          error: error instanceof Error ? error.message : 'Safety event history could not be loaded.',
        }));
      }
    })();

    refreshPromiseRef.current = job;
    void job.finally(() => {
      if (refreshPromiseRef.current === job) refreshPromiseRef.current = null;
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
    let refreshTimer: number | null = null;

    const scheduleRefresh = () => {
      if (!active) return;
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        void refresh();
      }, 500);
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

    socket.on('safety.event.created', scheduleRefresh);
    socket.on('safety.event.feedback.created', scheduleRefresh);

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
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
    };
  }, [refresh, session]);

  const setFilters = useCallback((patch: Partial<SafetyEventFilters>) => {
    setFiltersState((current) => ({
      ...current,
      ...patch,
      page: patch.page ?? 1,
    }));
  }, []);

  return { ...state, filters, setFilters, refresh };
}
