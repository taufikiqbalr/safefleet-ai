import type { UserRole } from '../auth/types';
import type { AlertRecord, AlertStatus } from './types';

export const ALERT_MUTATION_ROLES = ['OWNER', 'ADMIN', 'SUPERVISOR'] as const satisfies readonly UserRole[];

export function canMutateAlerts(role: UserRole): boolean {
  return ALERT_MUTATION_ROLES.includes(role as (typeof ALERT_MUTATION_ROLES)[number]);
}

export function allowedAlertActions(status: AlertStatus) {
  return {
    assign: status !== 'RESOLVED',
    acknowledge: status !== 'RESOLVED' && status !== 'ACKNOWLEDGED',
    escalate: status !== 'RESOLVED' && status !== 'ESCALATED',
    resolve: status !== 'RESOLVED',
  };
}

export function canActOnAlert(role: UserRole, alert: AlertRecord) {
  if (!canMutateAlerts(role)) {
    return { assign: false, acknowledge: false, escalate: false, resolve: false };
  }
  return allowedAlertActions(alert.status);
}
