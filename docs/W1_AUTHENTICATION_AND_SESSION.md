# W1 — Authentication & Tenant Session

## Objective

Turn the public W0 shell into an authenticated fleet-operations application using SafeFleet Backend's organization-scoped human-user JWT contract.

## Backend contracts

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/change-password
```

Login requires the organization slug, email, and password expected by the backend. The web app does not implement public registration.

## Session model

W1 will introduce an explicit browser session state machine:

```text
UNAUTHENTICATED
    |
    v
AUTHENTICATING
    |
    v
AUTHENTICATED
    |
    +----> EXPIRED / UNAUTHORIZED ----> UNAUTHENTICATED
```

For the MVP, the access token should be kept in memory and mirrored only to `sessionStorage` so a page refresh in the same tab can recover the session. It should not be persisted to `localStorage`, embedded in URLs, printed to logs, or placed in analytics payloads.

## Authenticated API client

A single request boundary will:

- attach `Authorization: Bearer <token>`;
- set JSON headers consistently;
- parse backend error responses;
- handle 401 by invalidating the browser session;
- distinguish 403 from 401;
- support `AbortSignal` for page/navigation cancellation;
- avoid logging authorization headers.

## Identity and tenant context

After login, the app will call `/auth/me` and keep the backend-provided user and organization identity as authoritative. The UI must never let a browser-supplied organization ID override the tenant derived by the backend.

## RBAC-aware navigation

Current backend roles used by the web app:

```text
OWNER
ADMIN
SUPERVISOR
ANALYST
VIEWER
```

W1 will hide navigation/actions the role cannot use, but UI hiding is only a usability measure. Backend authorization remains authoritative.

Initial intent:

- OWNER / ADMIN: full administration and policy access;
- SUPERVISOR: operational alert and trip actions;
- ANALYST: analytics/history read access plus permitted review endpoints;
- VIEWER: read-only operational visibility.

Exact route/action gates will follow the backend decorators rather than inventing a second authorization model.

## User experience

W1 screens/states:

- `/login` organization/email/password form;
- login progress and invalid-credential errors;
- authenticated app shell with current user/organization identity;
- logout action;
- session-expired state;
- forbidden state for direct navigation to disallowed routes;
- backend-unreachable error distinct from invalid credentials.

## Testing

Unit tests:

- session serialization/deserialization;
- expired/malformed session rejection;
- authorization header injection;
- 401 session invalidation;
- role-to-navigation filtering.

Integration-level browser behavior should verify login → `/auth/me` → protected route bootstrap using mocked HTTP responses.

## Acceptance criteria

W1 is complete when a seeded backend user can log in, refresh the tab without losing the valid session, see organization/user identity, access role-appropriate routes, receive a clear 401/403 experience, and explicitly log out. CI must remain green.

## Out of scope

Refresh tokens, SSO, password reset email, MFA, and organization switching are not introduced unless the backend exposes those contracts.
