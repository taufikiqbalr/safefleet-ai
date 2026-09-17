import { requestJson } from '../lib/api';
import type { ActiveAlertsResponse, DashboardSummary, LiveFleetResponse } from './types';

export function getDashboardSummary(token: string, signal?: AbortSignal): Promise<DashboardSummary> {
  return requestJson<DashboardSummary>('dashboard/summary', { method: 'GET', signal }, token);
}

export function getLiveFleet(
  token: string,
  options: { fleetId?: string; staleAfterSeconds?: number } = {},
  signal?: AbortSignal,
): Promise<LiveFleetResponse> {
  const query = new URLSearchParams();
  if (options.fleetId) query.set('fleetId', options.fleetId);
  if (options.staleAfterSeconds) query.set('staleAfterSeconds', String(options.staleAfterSeconds));
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  return requestJson<LiveFleetResponse>(`dashboard/live-fleet${suffix}`, { method: 'GET', signal }, token);
}

export function getActiveAlerts(
  token: string,
  options: { fleetId?: string; limit?: number } = {},
  signal?: AbortSignal,
): Promise<ActiveAlertsResponse> {
  const query = new URLSearchParams();
  if (options.fleetId) query.set('fleetId', options.fleetId);
  if (options.limit) query.set('limit', String(options.limit));
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  return requestJson<ActiveAlertsResponse>(`dashboard/active-alerts${suffix}`, { method: 'GET', signal }, token);
}
