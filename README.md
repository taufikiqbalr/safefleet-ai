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

### W0 — Web foundation

- React + TypeScript + Vite application shell;
- responsive fleet-operations layout;
- navigation and route boundaries;
- environment-based backend configuration;
- backend health diagnostics;
- reusable UI primitives and design tokens;
- lint, unit test, production build, and GitHub Actions CI;
- no fabricated fleet data in the foundation phase.

### W1 — Authentication and tenant session

- organization-scoped login;
- backend JWT session;
- authenticated `/auth/me` bootstrap;
- protected routes;
- role-aware navigation for OWNER/ADMIN/SUPERVISOR/ANALYST/VIEWER;
- logout/session expiry handling;
- API error boundary and unauthorized recovery.

### W2 — Live fleet operations dashboard

- `/dashboard/summary` KPI cards;
- `/dashboard/live-fleet` live vehicle/driver state;
- live map and status clustering;
- active trip state;
- latest GPS/speed/battery/network state;
- risk distribution and active alerts;
- stale/offline visualization;
- operational empty/loading/error states.

### W3 — Realtime alert center

- Socket.IO `/realtime` tenant session;
- safety/risk/alert/telemetry/sensor realtime updates;
- alert queue and filters;
- alert detail/history;
- assignment;
- acknowledge/escalate/resolve actions;
- realtime dashboard cache updates without polling everything.

### W4 — Safety history and analytics

- safety-event history;
- driver/vehicle/trip drill-down;
- drowsiness detail metrics;
- event feedback CONFIRMED/FALSE_ALARM/UNCERTAIN;
- analytics overview and trends;
- model/threshold comparison;
- latency analytics;
- report-ready filters and views.

### W5 — Fleet administration and policy

- fleets, drivers, vehicles, devices, assignments, and trips management;
- device credential rotation workflow for mobile provisioning;
- risk policy creation/versioning/activation;
- organization configuration;
- role-aware administrative actions.

### W6 — Validation and release hardening

- responsive/mobile-browser verification;
- accessibility pass;
- route-level error recovery;
- component/integration tests for critical operator flows;
- production environment configuration;
- security/deployment guidance;
- performance and bundle review;
- demo/release checklist.

Each phase has a detailed document under `docs/`, a clear acceptance boundary, and CI must be green before the phase is considered complete.

## W0 quick start

Requirements: Node.js 22+.

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3001`.

The default backend URL is `http://localhost:3000/api/v1`. Port `3001` intentionally matches the backend development CORS default.

Validation:

```bash
npm run lint
npm test
npm run build
```

See `docs/W0_WEB_FOUNDATION.md` for the detailed W0 contract.
