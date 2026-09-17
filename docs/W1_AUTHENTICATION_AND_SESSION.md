# W1 — Authentication & Tenant Session

## Status

**Complete.** W1 turns the public W0 shell into an authenticated fleet-operations application using SafeFleet Backend's organization-scoped human-user JWT contract.

## Backend contracts

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
GET  /api/v1/organizations/current
POST /api/v1/auth/change-password
```

Login requires organization slug, email, and password. The web application has no public-registration flow.

## Implemented session model

```text
UNAUTHENTICATED
    |
    v
AUTHENTICATING
    |
    v
AUTHENTICATED
    |
    +----> token expiry / backend 401
    |                |
    |                v
    +---------> UNAUTHENTICATED

saved session + backend unreachable
    |
    v
UNAVAILABLE
    |
    +----> retry verification
    +----> sign out
```

The access token is kept in React memory and mirrored to `sessionStorage` so a refresh in the same browser tab can recover the session. It is not written to `localStorage`, URLs, UI diagnostics, or logs.

A stored session contains:

```text
accessToken
tokenType
expiresAt
user snapshot
organization snapshot
```

The snapshots are not blindly trusted after refresh. Before protected routes open, the app revalidates the token using `/auth/me` and refreshes the organization using `/organizations/current`.

## Authenticated API boundary

`src/lib/api.ts` now provides the common JSON request boundary. It:

- normalizes requests against `VITE_API_BASE_URL`;
- attaches `Authorization: Bearer <token>` for authenticated calls;
- sends consistent JSON/Accept headers;
- parses NestJS error responses;
- exposes HTTP status through `ApiError`;
- supports `AbortSignal`;
- never logs authorization headers.

A `401` during session bootstrap invalidates the stored session. A backend network failure is shown separately from invalid credentials so an outage is not misrepresented as an account failure.

## Tenant identity

Authentication uses three backend-derived values:

```text
login response
    |
    +--> access token
    |
    +--> GET /auth/me
    |        |
    |        +--> current user / role / status
    |
    +--> GET /organizations/current
             |
             +--> current organization / slug / timezone / status
```

The browser never chooses an organization ID for protected API calls. Backend tenant context remains authoritative.

## Route protection

`ProtectedRoute` prevents the application shell and operator routes from rendering until session verification succeeds.

Unauthenticated navigation is redirected to `/login`, preserving the attempted path for post-login return. Expired sessions are removed and return the operator to sign-in. A temporarily unreachable backend displays an explicit recovery screen with retry and sign-out actions.

## RBAC-aware navigation

Current backend roles:

```text
OWNER
ADMIN
SUPERVISOR
ANALYST
VIEWER
```

W1 establishes role-aware management navigation:

- all authenticated roles retain operational overview/live-fleet/alerts/history/analytics route visibility;
- `OWNER`, `ADMIN`, and `SUPERVISOR` receive W5 driver/vehicle/device management navigation;
- `OWNER` and `ADMIN` receive W5 risk-policy and organization-settings management navigation;
- direct navigation through a W1 role-gated management route falls back to the `/forbidden` state.

These gates are an operator-experience boundary only. Backend decorators remain the security authority, and W5 must re-check the exact permission of each create/update/activate action before enabling it.

## Login experience

`/login` now provides:

- organization slug;
- email;
- password;
- disabled/progress state during authentication;
- invalid-credential feedback;
- backend-unreachable feedback distinct from a 401;
- current API endpoint information without displaying credentials or tokens.

The form does not prefill development credentials.

## Authenticated shell

After login the shell shows:

- backend-verified organization name and slug;
- operator full name and email;
- backend role;
- role-filtered navigation;
- explicit sign-out action;
- W1 phase identity.

The overview additionally shows session expiry and backend liveness without ever exposing the access token.

## Tests

W1 adds unit coverage for:

- valid session serialization/deserialization;
- expired and malformed session rejection;
- bearer header injection;
- HTTP 401 propagation through the API boundary;
- role-aware navigation and route-role boundaries.

Existing W0 configuration tests remain in the suite.

## Acceptance criteria

W1 is complete when:

1. a seeded backend user can authenticate through organization slug/email/password;
2. login is followed by `/auth/me` and `/organizations/current` verification;
3. protected routes do not render without a verified session;
4. a page refresh in the same tab can recover a valid session;
5. expired/invalid sessions are cleared;
6. backend-unreachable session verification is recoverable without being reported as invalid credentials;
7. organization/user/role identity is visible after login;
8. role-gated management navigation is enforced in the browser;
9. explicit logout clears the tab session;
10. lint, unit tests, and production build are green.

## Out of scope

Refresh tokens, SSO, password-reset email, MFA, organization switching, and cookie-based backend sessions are not invented by the frontend because the backend does not currently expose those contracts.

## Next phase — W2

W2 connects the authenticated application to the real fleet operations endpoints:

```text
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/live-fleet
GET /api/v1/dashboard/active-alerts
```

It will add dashboard KPIs, active-trip state, latest GPS/telemetry, connection status, risk state, and a fleet map. Socket.IO synchronization can then update this operational state without replacing backend API snapshots as the recovery source.
