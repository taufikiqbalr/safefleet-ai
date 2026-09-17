import type {
  DriverReference,
  PaginatedResult,
  RiskSnapshotSummary,
  UserReference,
  VehicleReference,
} from '../alerts/types';
import type { RealtimeStatus } from '../dashboard/types';

export type SafetyEventType = 'DROWSINESS' | 'CABIN_GAS' | 'DRIVER_DISTRACTION' | 'DEVICE_HEALTH';
export type SafetySeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type FeedbackClassification = 'CONFIRMED' | 'FALSE_ALARM' | 'UNCERTAIN';

export type SafetyEventRecord = {
  id: string;
  organizationId: string;
  deviceId: string;
  tripId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  clientEventId: string;
  syncBatchId: string | null;
  sequenceNumber: number | null;
  eventType: SafetyEventType;
  severity: SafetySeverity;
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

export type DrowsinessEventDetail = {
  id: string;
  safetyEventId: string;
  eyeAspectRatio: number | null;
  mouthAspectRatio: number | null;
  perclosPercent: number | null;
  blinkRatePerMinute: number | null;
  eyeClosureDurationMs: number | null;
  yawning: boolean | null;
  yawnDurationMs: number | null;
  headPitchDeg: number | null;
  headYawDeg: number | null;
  headRollDeg: number | null;
  faceDetected: boolean | null;
  createdAt: string;
};

export type DrowsinessEventBundle = {
  event: SafetyEventRecord;
  detail: DrowsinessEventDetail | null;
};

export type SafetyEventFeedback = {
  id: string;
  organizationId: string;
  safetyEventId: string;
  reviewerUserId: string;
  classification: FeedbackClassification;
  reason: string | null;
  createdAt: string;
};

export type DeviceReference = {
  id: string;
  deviceUid: string;
  platform: string;
  status: string;
  driverId: string | null;
  vehicleId: string | null;
  appVersion: string | null;
  modelVersion: string | null;
  lastSeenAt: string | null;
};

export type SafetyReferenceData = {
  drivers: DriverReference[];
  vehicles: VehicleReference[];
  devices: DeviceReference[];
  users: UserReference[];
};

export type SafetyEventFilters = {
  page: number;
  limit: number;
  eventType?: SafetyEventType;
  severity?: SafetySeverity;
  deviceId?: string;
  tripId?: string;
  driverId?: string;
  vehicleId?: string;
  from?: string;
  to?: string;
};

export type TelemetryPoint = {
  id: string;
  deviceId: string;
  tripId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  capturedAt: string;
  receivedAt: string;
  latitude: number | null;
  longitude: number | null;
  speedKph: number | null;
  batteryPercent: number | null;
  networkType: string | null;
  appVersion: string | null;
  modelVersion: string | null;
  inferenceLatencyMs: number | null;
};

export type SensorReading = {
  id: string;
  deviceId: string;
  tripId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  sensorId: string;
  sensorType: string;
  value: number;
  unit: string;
  sensorStatus: string | null;
  capturedAt: string;
  receivedAt: string;
  latitude: number | null;
  longitude: number | null;
  metadata: Record<string, unknown>;
};

export type SafetyEventDetailBundle = {
  event: SafetyEventRecord;
  drowsiness: DrowsinessEventDetail | null;
  feedback: SafetyEventFeedback[];
  riskSnapshot: RiskSnapshotSummary | null;
  references: SafetyReferenceData;
  telemetry: TelemetryPoint[];
  sensorReadings: SensorReading[];
};

export type SafetyEventListState = {
  result: PaginatedResult<SafetyEventRecord> | null;
  references: SafetyReferenceData | null;
  reviewStateByEventId: Record<string, FeedbackClassification | null>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  realtimeStatus: RealtimeStatus;
  lastSynchronizedAt: Date | null;
};

export type { PaginatedResult };
