export const USER_ROLES = ['OWNER', 'ADMIN', 'SUPERVISOR', 'ANALYST', 'VIEWER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AuthUser = {
  id: string;
  organizationId?: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: string;
};

export type AuthOrganization = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status?: string;
};

export type LoginPayload = {
  organizationSlug: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
  organization: AuthOrganization;
};

export type AuthSession = {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  user: AuthUser;
  organization: AuthOrganization;
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}
