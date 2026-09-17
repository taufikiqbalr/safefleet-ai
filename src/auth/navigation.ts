import type { UserRole } from './types';

export type NavigationItem = {
  to: string;
  label: string;
  phase: string;
  monogram: string;
  roles?: readonly UserRole[];
};

export const SUPERVISOR_MANAGEMENT_ROLES = ['OWNER', 'ADMIN', 'SUPERVISOR'] as const satisfies readonly UserRole[];
export const ADMIN_ROLES = ['OWNER', 'ADMIN'] as const satisfies readonly UserRole[];

export const navigationItems: readonly NavigationItem[] = [
  { to: '/', label: 'Overview', phase: 'W2', monogram: 'OV' },
  { to: '/live-fleet', label: 'Live Fleet', phase: 'W2', monogram: 'LF' },
  { to: '/alerts', label: 'Alert Center', phase: 'W3', monogram: 'AL' },
  { to: '/safety-events', label: 'Safety Events', phase: 'W4', monogram: 'SE' },
  { to: '/analytics', label: 'Analytics', phase: 'W4', monogram: 'AN' },
  { to: '/drivers', label: 'Drivers', phase: 'W5', monogram: 'DR', roles: SUPERVISOR_MANAGEMENT_ROLES },
  { to: '/vehicles', label: 'Vehicles', phase: 'W5', monogram: 'VH', roles: SUPERVISOR_MANAGEMENT_ROLES },
  { to: '/devices', label: 'Devices', phase: 'W5', monogram: 'DV', roles: SUPERVISOR_MANAGEMENT_ROLES },
  { to: '/risk-policies', label: 'Risk Policies', phase: 'W5', monogram: 'RP', roles: ADMIN_ROLES },
  { to: '/settings', label: 'Settings', phase: 'W5', monogram: 'ST', roles: ADMIN_ROLES },
];

export function navigationForRole(role: UserRole): NavigationItem[] {
  return navigationItems.filter((item) => !item.roles || item.roles.includes(role));
}

export function canAccessRoles(role: UserRole, allowed: readonly UserRole[]): boolean {
  return allowed.includes(role);
}
