import type { ConnectionStatus, LiveFleetItem, RiskLevel } from './types';

export type LiveFleetFilters = {
  search: string;
  risk: 'ALL' | RiskLevel | 'UNKNOWN';
  connection: 'ALL' | ConnectionStatus;
  alert: 'ALL' | 'ACTIVE' | 'NONE';
  fleetId: 'ALL' | string;
};

export const DEFAULT_LIVE_FLEET_FILTERS: LiveFleetFilters = {
  search: '',
  risk: 'ALL',
  connection: 'ALL',
  alert: 'ALL',
  fleetId: 'ALL',
};

export function toFiniteNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function hasCoordinates(item: LiveFleetItem): boolean {
  const latitude = toFiniteNumber(item.latitude);
  const longitude = toFiniteNumber(item.longitude);
  return latitude !== null && longitude !== null && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

export function filterLiveFleetItems(items: readonly LiveFleetItem[], filters: LiveFleetFilters): LiveFleetItem[] {
  const search = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.risk === 'UNKNOWN' && item.riskLevel !== null) return false;
    if (filters.risk !== 'ALL' && filters.risk !== 'UNKNOWN' && item.riskLevel !== filters.risk) return false;
    if (filters.connection !== 'ALL' && item.connectionStatus !== filters.connection) return false;
    if (filters.alert === 'ACTIVE' && !item.alertId) return false;
    if (filters.alert === 'NONE' && item.alertId) return false;
    if (filters.fleetId !== 'ALL' && item.fleetId !== filters.fleetId) return false;

    if (search) {
      const haystack = [
        item.driverName,
        item.driverCode,
        item.plateNumber,
        item.vehicleMake,
        item.vehicleModel,
        item.fleetName,
        item.deviceUid,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}
