import type { UserRole } from '../auth/types';

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
export type AlertSeverity = 'NORMAL' | 'CAUTION' | 'WARNING' | 'CRITICAL';
export type RealtimeStatus = 'connecting' | 'synchronizing' | 'ready' | 'reconnecting' | 'disconnected';

export type AlertRecord = {
  id: string;
  organizationId: string;
  tripId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  safetyEventId: string | null;
  riskSnapshotId: string | null;
  alertType: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string | null;
  dedupeKey: string;
  occurrenceCount: number;
  firstEventAt: string;
  lastEventAt: string;
  assignedToUserId: string | null;
  assignedAt: string | null;
  acknowledgedByUserId: string | null;
  acknowledgedAt: string | null;
  resolvedByUserId: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AlertHistoryEntry = {
  id: string;
  organizationId: string;
  alertId: string;
  fromStatus: AlertStatus | null;
  toStatus: AlertStatus;
  actorUserId: string | null;
  note: string | null;
  createdAt: string;
};

export type PaginatedResult<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AlertFilters = {
  page: number;
  limit: number;
  status?: AlertStatus;
  severity?: AlertSeverity;
  tripId?: string;
  driverId?: string;
  vehicleId?: string;
  assignedToUserId?: string;
  from?: string;
  to?: string;
};

export type DriverReference = {
  id: string;
  employeeCode: string;
  fullName: string;
  status: string;
};

export type VehicleReference = {
  id: string;
  plateNumber: string;
  make: string | null;
  model: string | null;
  status: string;
};

export type UserReference = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: string;
};

export type AlertReferenceData = {
  drivers: DriverReference[];
  vehicles: VehicleReference[];
  users: UserReference[];
};

export type SafetyEventSummary = {
  id: string;
  deviceId: string;
  tripId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  eventType: string;
  severity: string;
  sourceAlertLevel: string | null;
  drowsinessScore: number | null;
  localAlarmTriggered: boolean | null;
  thresholdProfile: string | null;
  capturedAt: string;
  receivedAt: string;
  latitude: number | null;
  longitude: number | null;
  appVersion: string | null;
  modelVersion: string | null;
  inferenceLatencyMs: number | null;
  metadata: Record<string, unknown>;
};

export type RiskSnapshotSummary = {
  id: string;
  organizationId: string;
  tripId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  safetyEventId: string;
  policyId: string;
  policyVersion: number;
  riskLevel: AlertSeverity;
  score: number | null;
  contributingFactors: Record<string, unknown>;
  calculatedAt: string;
};

export type AlertDetailBundle = {
  alert: AlertRecord;
  history: AlertHistoryEntry[];
  safetyEvent: SafetyEventSummary | null;
  riskSnapshot: RiskSnapshotSummary | null;
  references: AlertReferenceData;
};
