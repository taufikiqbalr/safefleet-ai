# SafeFleet AI Web

Fleet operations and Driver Safety Management Platform (DSMP) for SafeFleet AI.

This repository is the supervisor/fleet-manager web application. It consumes the APIs and realtime events from `taufikiqbalr/safefleet-ai_backend`; camera inference and immediate driver alarms remain in `taufikiqbalr/safefleet-ai_mobile`.

## Repository role

```text
SafeFleet Mobile
  = perception + immediate driver safety

SafeFleet Backend
  = fleet safety intelligence + storage + alerts + realtime

SafeFleet Web
  = supervisor / fleet operations / analytics
```

## Phased implementation

| Phase | Focus | Status | Detail |
| --- | --- | --- | --- |
| **W0** | React/TypeScript/Vite foundation, responsive operations shell, health diagnostics, CI | ✅ Complete | [W0 detail](docs/W0_WEB_FOUNDATION.md) |
| **W1** | Organization login, JWT session, protected routes, RBAC-aware navigation | ✅ Complete | [W1 detail](docs/W1_AUTHENTICATION_AND_SESSION.md) |
| **W2** | Real dashboard summary, live fleet/GPS/risk state, realtime synchronization | Next | [W2 detail](docs/W2_LIVE_FLEET_DASHBOARD.md) |
| **W3** | Realtime alert queue, detail/history, assign/acknowledge/escalate/resolve | Planned | [W3 detail](docs/W3_REALTIME_ALERT_CENTER.md) |
| **W4** | Safety-event history, drowsiness details, feedback, trends/model/latency analytics | Planned | [W4 detail](docs/W4_SAFETY_HISTORY_AND_ANALYTICS.md) |
| **W5** | Fleet/driver/vehicle/device/assignment/trip administration and risk policies | Planned | [W5 detail](docs/W5_FLEET_ADMIN_AND_RISK_POLICY.md) |
| **W6** | Accessibility, E2E, security, resilience, performance and production deployment | Planned | [W6 detail](docs/W6_VALIDATION_AND_RELEASE.md) |

Overall dependency and MVP boundary: [Web roadmap](docs/WEB_ROADMAP.md).

Each phase has a clear acceptance boundary and CI must be green before the phase is considered complete.

## Local quick start

Requirements: Node.js 22+ and SafeFleet Backend running locally.

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3001`.

The default backend URL is `http://localhost:3000/api/v1`. Port `3001` intentionally matches the backend development CORS configuration.

When the backend uses its default development seed, the local operator account is:

```text
organization: safefleet-demo
email:        admin@safefleet.local
password:     ChangeMe123!
```

Those values are development-only seed credentials from the backend configuration and must not be reused in a deployed environment.

## W1 authentication model

W1 uses the backend contracts:

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
GET  /api/v1/organizations/current
POST /api/v1/auth/change-password
```

The browser stores the access token only in memory and `sessionStorage`, not `localStorage`. A refresh in the same tab can recover the session, but the app revalidates both the user and organization against the backend before opening protected routes.

Current backend roles used by the UI are:

```text
OWNER
ADMIN
SUPERVISOR
ANALYST
VIEWER
```

Navigation hiding and route guards improve the operator experience; backend authorization remains authoritative.

## Current experience

After successful login, the W1 overview shows real authenticated organization/user identity, backend reachability, role, and session expiry. W2+ operational routes remain explicit phase placeholders until their real API integrations are implemented. No fake drivers, alerts, GPS positions, risk scores, or analytics are rendered.

## Validation

```bash
npm run lint
npm test
npm run build
```

GitHub Actions performs the same validation on every push and pull request.
