export type RiskLevel = 'NORMAL' | 'CAUTION' | 'WARNING' | 'CRITICAL';
export type ConnectionStatus = 'ONLINE' | 'STALE' | 'OFFLINE';
export type NumericValue = number | string | null;

export type DashboardSummary = {
  generatedAt: string;
  activeTrips: number;
  activeAlerts: number;
  onlineDevices: number;
  activeDrivers: number;
  activeVehicles: number;
  safetyEvents24h: number;
  alerts24h: number;
  activeAlertsBySeverity: Array<{ severity: string; count: number }>;
  activeTripsByLatestRisk: Array<{ riskLevel: string; count: number }>;
};

export type LiveFleetItem = {
  tripId: string;
  tripStartedAt: string | null;
  driverId: string;
  driverCode: string;
  driverName: string;
  vehicleId: string;
  plateNumber: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  fleetId: string | null;
  fleetName: string | null;
  deviceId: string | null;
  deviceUid: string | null;
  deviceLastSeenAt: string | null;
  locationCapturedAt: string | null;
  locationReceivedAt: string | null;
  latitude: NumericValue;
  longitude: NumericValue;
  speedKph: NumericValue;
  batteryPercent: number | null;
  networkType: string | null;
  riskLevel: RiskLevel | null;
  riskScore: NumericValue;
  riskCalculatedAt: string | null;
  alertId: string | null;
  alertSeverity: string | null;
  alertStatus: string | null;
  alertOccurrenceCount: number | null;
  alertLastEventAt: string | null;
  alertAssignedToUserId: string | null;
  alertAssignedToName: string | null;
  connectionStatus: ConnectionStatus;
  latestSeenAt: string | null;
};

export type LiveFleetResponse = {
  generatedAt: string;
  staleAfterSeconds: number;
  items: LiveFleetItem[];
};

export type ActiveAlert = {
  id: string;
  alertType: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  occurrenceCount: number;
  firstEventAt: string;
  lastEventAt: string;
  assignedToUserId: string | null;
  assignedAt: string | null;
  assignedToName: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  tripId: string | null;
  driverId: string | null;
  driverName: string | null;
  driverCode: string | null;
  vehicleId: string | null;
  plateNumber: string | null;
  fleetId: string | null;
  fleetName: string | null;
  latitude: NumericValue;
  longitude: NumericValue;
  locationCapturedAt: string | null;
};

export type ActiveAlertsResponse = {
  generatedAt: string;
  items: ActiveAlert[];
};

export type RealtimeStatus = 'connecting' | 'synchronizing' | 'ready' | 'reconnecting' | 'disconnected';
