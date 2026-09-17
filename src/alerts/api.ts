import { requestJson } from '../lib/api';
import type {
  AlertDetailBundle,
  AlertFilters,
  AlertHistoryEntry,
  AlertRecord,
  AlertReferenceData,
  DriverReference,
  PaginatedResult,
  RiskSnapshotSummary,
  SafetyEventSummary,
  UserReference,
  VehicleReference,
} from './types';

function isoOrUndefined(value?: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function buildAlertQuery(filters: AlertFilters): string {
  const query = new URLSearchParams();
  query.set('page', String(filters.page));
  query.set('limit', String(filters.limit));
  if (filters.status) query.set('status', filters.status);
  if (filters.severity) query.set('severity', filters.severity);
  if (filters.tripId) query.set('tripId', filters.tripId);
  if (filters.driverId) query.set('driverId', filters.driverId);
  if (filters.vehicleId) query.set('vehicleId', filters.vehicleId);
  if (filters.assignedToUserId) query.set('assignedToUserId', filters.assignedToUserId);
  const from = isoOrUndefined(filters.from);
  const to = isoOrUndefined(filters.to);
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  return query.toString();
}

export function listAlerts(token: string, filters: AlertFilters, signal?: AbortSignal) {
  return requestJson<PaginatedResult<AlertRecord>>(
    `alerts?${buildAlertQuery(filters)}`,
    { method: 'GET', signal },
    token,
  );
}

export function getAlert(token: string, alertId: string, signal?: AbortSignal) {
  return requestJson<AlertRecord>(`alerts/${alertId}`, { method: 'GET', signal }, token);
}

export function getAlertHistory(token: string, alertId: string, signal?: AbortSignal) {
  return requestJson<AlertHistoryEntry[]>(`alerts/${alertId}/history`, { method: 'GET', signal }, token);
}

export function assignAlert(
  token: string,
  alertId: string,
  userId: string | null,
  note?: string,
  signal?: AbortSignal,
) {
  return requestJson<AlertRecord>(
    `alerts/${alertId}/assign`,
    {
      method: 'POST',
      body: JSON.stringify({ userId: userId ?? undefined, note: note?.trim() || undefined }),
      signal,
    },
    token,
  );
}

export function acknowledgeAlert(token: string, alertId: string, note?: string, signal?: AbortSignal) {
  return postAlertAction(token, alertId, 'acknowledge', note, signal);
}

export function escalateAlert(token: string, alertId: string, note?: string, signal?: AbortSignal) {
  return postAlertAction(token, alertId, 'escalate', note, signal);
}

export function resolveAlert(token: string, alertId: string, note?: string, signal?: AbortSignal) {
  return postAlertAction(token, alertId, 'resolve', note, signal);
}

function postAlertAction(
  token: string,
  alertId: string,
  action: 'acknowledge' | 'escalate' | 'resolve',
  note?: string,
  signal?: AbortSignal,
) {
  return requestJson<AlertRecord>(
    `alerts/${alertId}/${action}`,
    {
      method: 'POST',
      body: JSON.stringify({ note: note?.trim() || undefined }),
      signal,
    },
    token,
  );
}

export async function getAlertReferenceData(
  token: string,
  includeUsers: boolean,
  signal?: AbortSignal,
): Promise<AlertReferenceData> {
  const [drivers, vehicles, users] = await Promise.all([
    requestJson<PaginatedResult<DriverReference>>('drivers?page=1&limit=100', { method: 'GET', signal }, token),
    requestJson<PaginatedResult<VehicleReference>>('vehicles?page=1&limit=100', { method: 'GET', signal }, token),
    includeUsers
      ? requestJson<PaginatedResult<UserReference>>('users?page=1&limit=100', { method: 'GET', signal }, token)
      : Promise.resolve({ items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
  ]);
  return { drivers: drivers.items, vehicles: vehicles.items, users: users.items };
}

async function getRiskSnapshot(
  token: string,
  alert: AlertRecord,
  signal?: AbortSignal,
): Promise<RiskSnapshotSummary | null> {
  if (!alert.riskSnapshotId) return null;
  const query = new URLSearchParams({ page: '1', limit: '100' });
  if (alert.tripId) query.set('tripId', alert.tripId);
  else if (alert.driverId) query.set('driverId', alert.driverId);
  else if (alert.vehicleId) query.set('vehicleId', alert.vehicleId);
  const result = await requestJson<PaginatedResult<RiskSnapshotSummary>>(
    `risk-snapshots?${query.toString()}`,
    { method: 'GET', signal },
    token,
  );
  return result.items.find((item) => item.id === alert.riskSnapshotId) ?? null;
}

export async function getAlertDetailBundle(
  token: string,
  alertId: string,
  includeUsers: boolean,
  signal?: AbortSignal,
): Promise<AlertDetailBundle> {
  const alert = await getAlert(token, alertId, signal);
  const [history, references, safetyEvent, riskSnapshot] = await Promise.all([
    getAlertHistory(token, alertId, signal),
    getAlertReferenceData(token, includeUsers, signal),
    alert.safetyEventId
      ? requestJson<SafetyEventSummary>(`safety-events/${alert.safetyEventId}`, { method: 'GET', signal }, token).catch(() => null)
      : Promise.resolve(null),
    getRiskSnapshot(token, alert, signal).catch(() => null),
  ]);
  return { alert, history, references, safetyEvent, riskSnapshot };
}
