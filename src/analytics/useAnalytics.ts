import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';
import { getAnalyticsBundle } from './api';
import type { AnalyticsBundle, AnalyticsFilters } from './types';

function dateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultFilters(): AnalyticsFilters {
  const to = new Date();
  const from = new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000);
  return { from: dateInput(from), to: dateInput(to), bucket: 'day' };
}

type AnalyticsState = {
  bundle: AnalyticsBundle | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastSynchronizedAt: Date | null;
};

const initialState: AnalyticsState = {
  bundle: null,
  loading: true,
  refreshing: false,
  error: null,
  lastSynchronizedAt: null,
};

export function useAnalytics() {
  const { session, logout } = useAuth();
  const [filters, setFilters] = useState<AnalyticsFilters>(() => defaultFilters());
  const [state, setState] = useState<AnalyticsState>(initialState);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!session) return;
    setState((current) => ({
      ...current,
      loading: current.bundle === null,
      refreshing: current.bundle !== null,
      error: null,
    }));
    try {
      const bundle = await getAnalyticsBundle(session.accessToken, filters, signal);
      setState({
        bundle,
        loading: false,
        refreshing: false,
        error: null,
        lastSynchronizedAt: new Date(),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (error instanceof ApiError && error.status === 401) {
        logout('Your SafeFleet session is no longer authorized. Please sign in again.');
        return;
      }
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : 'Analytics could not be loaded.',
      }));
    }
  }, [filters, logout, session]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  return { ...state, filters, setFilters, refresh };
}
