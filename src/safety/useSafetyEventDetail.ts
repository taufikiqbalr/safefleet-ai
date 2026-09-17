import { useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';
import { appConfig } from '../lib/config';
import { addSafetyEventFeedback, getSafetyEventDetailBundle } from './api';
import { canListUsersForSafetyReview, canReviewSafetyEvent } from './permissions';
import type {
  FeedbackClassification,
  SafetyEventDetailBundle,
} from './types';
import type { RealtimeStatus } from '../dashboard/types';

type DetailState = {
  bundle: SafetyEventDetailBundle | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  actionError: string | null;
  actionInProgress: boolean;
  realtimeStatus: RealtimeStatus;
};

const initialState: DetailState = {
  bundle: null,
  loading: true,
  refreshing: false,
  error: null,
  actionError: null,
  actionInProgress: false,
  realtimeStatus: 'connecting',
};

export function useSafetyEventDetail(eventId: string) {
  const { session, logout } = useAuth();
  const [state, setState] = useState<DetailState>(initialState);
  const includeUsers = session ? canListUsersForSafetyReview(session.user.role) : false;
  const canReview = session ? canReviewSafetyEvent(session.user.role) : false;

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!session || !eventId) return;
    setState((current) => ({
      ...current,
      loading: current.bundle === null,
      refreshing: current.bundle !== null,
      error: null,
    }));
    try {
      const bundle = await getSafetyEventDetailBundle(
        session.accessToken,
        eventId,
        includeUsers,
        signal,
      );
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
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : 'Safety event detail could not be loaded.',
      }));
    }
  }, [eventId, includeUsers, logout, session]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!session || !eventId) return;
    let active = true;
    let timer: number | null = null;

    const scheduleRefresh = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        void refresh();
      }, 350);
    };

    const socket = io(`${appConfig.realtimeBaseUrl}/realtime`, {
      auth: { token: session.accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
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

    socket.on('safety.event.feedback.created', (payload: { safetyEventId?: string }) => {
      if (payload.safetyEventId === eventId) scheduleRefresh();
    });
    socket.on('risk.updated', (payload: { safetyEventId?: string }) => {
      if (payload.safetyEventId === eventId) scheduleRefresh();
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
  }, [eventId, refresh, session]);

  const submitFeedback = useCallback(async (
    classification: FeedbackClassification,
    reason?: string,
  ) => {
    if (!session || !canReview) return;
    setState((current) => ({ ...current, actionInProgress: true, actionError: null }));
    try {
      await addSafetyEventFeedback(session.accessToken, eventId, classification, reason);
      await refresh();
      setState((current) => ({ ...current, actionInProgress: false, actionError: null }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout('Your SafeFleet session is no longer authorized. Please sign in again.');
        return;
      }
      setState((current) => ({
        ...current,
        actionInProgress: false,
        actionError: error instanceof Error ? error.message : 'Feedback could not be submitted.',
      }));
    }
  }, [canReview, eventId, logout, refresh, session]);

  return { ...state, canReview, refresh, submitFeedback };
}
