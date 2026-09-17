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
| **W2** | Real dashboard summary, live fleet/GPS/risk state, realtime synchronization | ✅ Complete | [W2 detail](docs/W2_LIVE_FLEET_DASHBOARD.md) |
| **W3** | Realtime alert queue, detail/history, assign/acknowledge/escalate/resolve | ✅ Complete | [W3 detail](docs/W3_REALTIME_ALERT_CENTER.md) |
| **W4** | Safety-event history, drowsiness details, feedback, trends/model/latency analytics | ✅ Complete | [W4 detail](docs/W4_SAFETY_HISTORY_AND_ANALYTICS.md) |
| **W5** | Fleet/driver/vehicle/device/assignment/trip administration and risk policies | Next | [W5 detail](docs/W5_FLEET_ADMIN_AND_RISK_POLICY.md) |
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

Open `http://localhost:6200`.

The default backend URL is `http://localhost:6100/api/v1`. Port `6200` intentionally matches the backend development CORS configuration. Local SafeFleet host-facing services use the 6xxx range.

When the backend uses its default development seed, the local operator account is:

```text
organization: safefleet-demo
email:        admin@safefleet.local
password:     ChangeMe123!
```

Those values are development-only seed credentials and must not be reused in a deployed environment.

## Current web contract

Authentication:

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
GET  /api/v1/organizations/current
```

Fleet operations:

```text
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/live-fleet
GET /api/v1/dashboard/active-alerts
Socket.IO /realtime
```

Alert operations:

```text
GET  /api/v1/alerts
GET  /api/v1/alerts/:id
GET  /api/v1/alerts/:id/history
POST /api/v1/alerts/:id/assign
POST /api/v1/alerts/:id/acknowledge
POST /api/v1/alerts/:id/escalate
POST /api/v1/alerts/:id/resolve
```

Safety history and analytics:

```text
GET  /api/v1/safety-events
GET  /api/v1/safety-events/:id
GET  /api/v1/drowsiness-events/:eventId
GET  /api/v1/safety-events/:id/feedback
POST /api/v1/safety-events/:id/feedback
GET  /api/v1/risk-snapshots
GET  /api/v1/telemetry
GET  /api/v1/sensor-readings
GET  /api/v1/analytics/overview
GET  /api/v1/analytics/trends
GET  /api/v1/analytics/models
GET  /api/v1/analytics/latency
```

The browser stores the access token only in memory and `sessionStorage`, not `localStorage`. Backend tenant scope remains authoritative.

W2 overview and `/live-fleet` use real backend snapshots. W3 `/alerts` uses the backend alert queue, lifecycle history and supervisor actions. W4 `/safety-events` and `/analytics` provide historical investigation, drowsiness evidence, human feedback, event-adjacent telemetry/sensor context, descriptive model/profile groups and latency visibility.

Socket.IO events invalidate live/event snapshots and trigger debounced REST synchronization. Historical analytics remain explicit selected-range snapshots rather than redrawing on every device event.

Safety review writes are enabled for `OWNER`, `ADMIN`, `SUPERVISOR`, and `ANALYST`, matching the backend controller. `VIEWER` remains read-only. The UI does not invent universal EAR/MAR/PERCLOS thresholds, toxic-gas thresholds, model rankings, or causal conclusions that are not provided by the backend data.

## Validation

```bash
npm run lint
npm test
npm run build
```

GitHub Actions performs the same validation on every push and pull request.
