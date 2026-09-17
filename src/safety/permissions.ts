import type { UserRole } from '../auth/types';

const REVIEW_ROLES = ['OWNER', 'ADMIN', 'SUPERVISOR', 'ANALYST'] as const satisfies readonly UserRole[];

export function canReviewSafetyEvent(role: UserRole): boolean {
  return REVIEW_ROLES.includes(role as (typeof REVIEW_ROLES)[number]);
}

export function canListUsersForSafetyReview(role: UserRole): boolean {
  return role !== 'VIEWER';
}
