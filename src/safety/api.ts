import { ApiError, requestJson } from '../lib/api';
import type {
  DrowsinessEventBundle,
  FeedbackClassification,
  PaginatedResult,
  SafetyEventDetailBundle,
  SafetyEventFeedback,
  SafetyEventFilters,
  SafetyEventRecord,
  SafetyReferenceData,
  SensorReading,
  TelemetryPoint,
} from './types';
import type {
  DriverReference,
  RiskSnapshotSummary,
  UserReference,
  VehicleReference,
} from '../alerts/types';
import type { DeviceReference } from './types';

export function normalizeDateFilter(value: string | undefined, endOfDay = false): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const parsed = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
        endOfDay ? 23 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 999 : 0,
      )
    : new Date(trimmed);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function buildSafetyEventQuery(filters: SafetyEventFilters): string {
  const query = new URLSearchParams();
  query.set('page', String(filters.page));
  query.set('limit', String(filters.limit));
  if (filters.eventType) query.set('eventType', filters.eventType);
  if (filters.severity) query.set('severity', filters.severity);
  if (filters.deviceId?.trim()) query.set('deviceId', filters.deviceId.trim());
  if (filters.tripId?.trim()) query.set('tripId', filters.tripId.trim());
  if (filters.driverId) query.set('driverId', filters.driverId);
  if (filters.vehicleId) query.set('vehicleId', filters.vehicleId);
  const from = normalizeDateFilter(filters.from, false);
  const to = normalizeDateFilter(filters.to, true);
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  return query.toString();
}

export function listSafetyEvents(token: string, filters: SafetyEventFilters, signal?: AbortSignal) {
  return requestJson<PaginatedResult<SafetyEventRecord>>(
    `safety-events?${buildSafetyEventQuery(filters)}`,
    { method: 'GET', signal },
    token,
  );
}

export function getSafetyEvent(token: string, eventId: string, signal?: AbortSignal) {
  return requestJson<SafetyEventRecord>(`safety-events/${eventId}`, { method: 'GET', signal }, token);
}

export function getDrowsinessEvent(token: string, eventId: string, signal?: AbortSignal) {
  return requestJson<DrowsinessEventBundle>(`drowsiness-events/${eventId}`, { method: 'GET', signal }, token);
}

export function listSafetyEventFeedback(token: string, eventId: string, signal?: AbortSignal) {
  return requestJson<SafetyEventFeedback[]>(`safety-events/${eventId}/feedback`, { method: 'GET', signal }, token);
}

export function addSafetyEventFeedback(
  token: string,
  eventId: string,
  classification: FeedbackClassification,
  reason?: string,
  signal?: AbortSignal,
) {
  return requestJson<SafetyEventFeedback>(
    `safety-events/${eventId}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify({ classification, reason: reason?.trim() || undefined }),
      signal,
    },
    token,
  );
}

export async function getSafetyReferenceData(
  token: string,
  includeUsers: boolean,
  signal?: AbortSignal,
): Promise<SafetyReferenceData> {
  const [drivers, vehicles, devices, users] = await Promise.all([
    requestJson<PaginatedResult<DriverReference>>('drivers?page=1&limit=100', { method: 'GET', signal }, token),
    requestJson<PaginatedResult<VehicleReference>>('vehicles?page=1&limit=100', { method: 'GET', signal }, token),
    requestJson<PaginatedResult<DeviceReference>>('devices?page=1&limit=100', { method: 'GET', signal }, token),
    includeUsers
      ? requestJson<PaginatedResult<UserReference>>('users?page=1&limit=100', { method: 'GET', signal }, token)
      : Promise.resolve({ items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
  ]);

  return {
    drivers: drivers.items,
    vehicles: vehicles.items,
    devices: devices.items,
    users: users.items,
  };
}

export async function getReviewStateByEventId(
  token: string,
  events: readonly SafetyEventRecord[],
  signal?: AbortSignal,
): Promise<Record<string, FeedbackClassification | null>> {
  const entries = await Promise.all(events.map(async (event) => {
    try {
      const feedback = await listSafetyEventFeedback(token, event.id, signal);
      return [event.id, feedback[0]?.classification ?? null] as const;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw error;
      return [event.id, null] as const;
    }
  }));
  return Object.fromEntries(entries);
}

async function getRiskSnapshotForEvent(
  token: string,
  event: SafetyEventRecord,
  signal?: AbortSignal,
): Promise<RiskSnapshotSummary | null> {
  const query = new URLSearchParams({ page: '1', limit: '100' });
  if (event.tripId) query.set('tripId', event.tripId);
  else if (event.driverId) query.set('driverId', event.driverId);
  else if (event.vehicleId) query.set('vehicleId', event.vehicleId);

  const result = await requestJson<PaginatedResult<RiskSnapshotSummary>>(
    `risk-snapshots?${query.toString()}`,
    { method: 'GET', signal },
    token,
  );
  return result.items.find((item) => item.safetyEventId === event.id) ?? null;
}

function contextQuery(event: SafetyEventRecord): string {
  const capturedAt = new Date(event.capturedAt);
  const query = new URLSearchParams({ page: '1', limit: '50' });
  if (!Number.isNaN(capturedAt.getTime())) {
    query.set('from', new Date(capturedAt.getTime() - 5 * 60_000).toISOString());
    query.set('to', new Date(capturedAt.getTime() + 5 * 60_000).toISOString());
  }
  if (event.tripId) query.set('tripId', event.tripId);
  else query.set('deviceId', event.deviceId);
  return query.toString();
}

export async function getSafetyEventDetailBundle(
  token: string,
  eventId: string,
  includeUsers: boolean,
  signal?: AbortSignal,
): Promise<SafetyEventDetailBundle> {
  const event = await getSafetyEvent(token, eventId, signal);
  const query = contextQuery(event);
  const [feedback, references, drowsiness, riskSnapshot, telemetry, sensorReadings] = await Promise.all([
    listSafetyEventFeedback(token, eventId, signal),
    getSafetyReferenceData(token, includeUsers, signal),
    event.eventType === 'DROWSINESS'
      ? getDrowsinessEvent(token, eventId, signal).then((bundle) => bundle.detail)
      : Promise.resolve(null),
    getRiskSnapshotForEvent(token, event, signal).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) throw error;
      return null;
    }),
    requestJson<PaginatedResult<TelemetryPoint>>(`telemetry?${query}`, { method: 'GET', signal }, token)
      .then((result) => result.items)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) throw error;
        return [];
      }),
    requestJson<PaginatedResult<SensorReading>>(`sensor-readings?${query}`, { method: 'GET', signal }, token)
      .then((result) => result.items)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) throw error;
        return [];
      }),
  ]);

  return { event, feedback, references, drowsiness, riskSnapshot, telemetry, sensorReadings };
}
