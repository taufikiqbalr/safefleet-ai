import { describe, expect, it } from 'vitest';

import { DEFAULT_LIVE_FLEET_FILTERS, filterLiveFleetItems, hasCoordinates, toFiniteNumber } from './filters';
import type { LiveFleetItem } from './types';

const baseItem: LiveFleetItem = {
  tripId: 'trip-1',
  tripStartedAt: null,
  driverId: 'driver-1',
  driverCode: 'DRV-001',
  driverName: 'Taufik Driver',
  vehicleId: 'vehicle-1',
  plateNumber: 'B 1234 SF',
  vehicleMake: 'SafeFleet',
  vehicleModel: 'Demo',
  fleetId: 'fleet-1',
  fleetName: 'Jakarta Fleet',
  deviceId: 'device-1',
  deviceUid: 'android-1',
  deviceLastSeenAt: null,
  locationCapturedAt: null,
  locationReceivedAt: null,
  latitude: '-6.2',
  longitude: '106.8',
  speedKph: '42.5',
  batteryPercent: 80,
  networkType: '4g',
  riskLevel: 'WARNING',
  riskScore: 60,
  riskCalculatedAt: null,
  alertId: 'alert-1',
  alertSeverity: 'WARNING',
  alertStatus: 'OPEN',
  alertOccurrenceCount: 1,
  alertLastEventAt: null,
  alertAssignedToUserId: null,
  alertAssignedToName: null,
  connectionStatus: 'ONLINE',
  latestSeenAt: null,
};

describe('W2 live fleet helpers', () => {
  it('normalizes numeric API values and validates GPS coordinates', () => {
    expect(toFiniteNumber('42.5')).toBe(42.5);
    expect(toFiniteNumber('not-a-number')).toBeNull();
    expect(hasCoordinates(baseItem)).toBe(true);
  });

  it('filters the loaded snapshot by risk and connection state', () => {
    const result = filterLiveFleetItems([baseItem], {
      ...DEFAULT_LIVE_FLEET_FILTERS,
      risk: 'WARNING',
      connection: 'ONLINE',
    });
    expect(result).toHaveLength(1);
    expect(filterLiveFleetItems([baseItem], {
      ...DEFAULT_LIVE_FLEET_FILTERS,
      risk: 'CRITICAL',
    })).toHaveLength(0);
  });

  it('searches driver, vehicle and fleet identity without inventing missing data', () => {
    expect(filterLiveFleetItems([baseItem], {
      ...DEFAULT_LIVE_FLEET_FILTERS,
      search: 'b 1234',
    })).toHaveLength(1);
    expect(filterLiveFleetItems([baseItem], {
      ...DEFAULT_LIVE_FLEET_FILTERS,
      search: 'surabaya',
    })).toHaveLength(0);
  });
});
