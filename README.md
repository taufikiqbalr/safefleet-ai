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

| Phase | Focus | Detail |
| --- | --- | --- |
| **W0** | React/TypeScript/Vite foundation, responsive operations shell, health diagnostics, CI | [W0 detail](docs/W0_WEB_FOUNDATION.md) |
| **W1** | Organization login, JWT session, protected routes, RBAC-aware navigation | [W1 detail](docs/W1_AUTHENTICATION_AND_SESSION.md) |
| **W2** | Real dashboard summary, live fleet/GPS/risk state, realtime synchronization | [W2 detail](docs/W2_LIVE_FLEET_DASHBOARD.md) |
| **W3** | Realtime alert queue, detail/history, assign/acknowledge/escalate/resolve | [W3 detail](docs/W3_REALTIME_ALERT_CENTER.md) |
| **W4** | Safety-event history, drowsiness details, feedback, trends/model/latency analytics | [W4 detail](docs/W4_SAFETY_HISTORY_AND_ANALYTICS.md) |
| **W5** | Fleet/driver/vehicle/device/assignment/trip administration and risk policies | [W5 detail](docs/W5_FLEET_ADMIN_AND_RISK_POLICY.md) |
| **W6** | Accessibility, E2E, security, resilience, performance and production deployment | [W6 detail](docs/W6_VALIDATION_AND_RELEASE.md) |

Overall dependency and MVP boundary: [Web roadmap](docs/WEB_ROADMAP.md).

Each phase has a clear acceptance boundary and CI must be green before the phase is considered complete.

## W0 quick start

Requirements: Node.js 22+.

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3001`.

The default backend URL is `http://localhost:3000/api/v1`. Port `3001` intentionally matches the backend development CORS default.

W0 is backend-aware but does not fabricate drivers, alerts, GPS positions, risk scores, or analytics. The overview can be tried with the backend online or offline; it shows real backend liveness state and the phased product shell.

Validation:

```bash
npm run lint
npm test
npm run build
```

GitHub Actions performs the same validation on every push and pull request.
