# W0 — Web Foundation

W0 establishes the web application shell for SafeFleet fleet operations. It is intentionally backend-aware but operational-data neutral: this phase does not fabricate drivers, alerts, risk, GPS locations, or analytics simply to make the dashboard look populated.

## Objective

Produce a reproducible frontend that can be opened immediately, confirms whether SafeFleet Backend is reachable, establishes the long-lived operator navigation structure, and gives later phases stable boundaries for authentication, live fleet operations, realtime alerts, analytics, and administration.

## Implemented stack

- React 19 + TypeScript;
- Vite development/build toolchain;
- React Router route boundaries;
- plain CSS design tokens and responsive components to avoid an unnecessary UI-framework dependency in the foundation;
- Vitest for unit tests;
- ESLint flat configuration;
- GitHub Actions CI on Node.js 22.

## Runtime topology

```text
Browser :3001
    |
    | HTTP / future Socket.IO
    v
SafeFleet Backend :3000/api/v1
    |
    v
PostgreSQL / PostGIS
```

The development server runs on port `3001`. This is deliberate because the backend currently defaults `CORS_ORIGINS` to `http://localhost:3001`.

## Environment configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Default:

```text
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

The application normalizes trailing slashes and rejects non-HTTP(S) API base URLs. Production environments must provide the deployed backend URL instead of relying on this local default.

## Foundation user experience

The W0 overview screen provides:

- clear W0 phase identity;
- real backend `/health/live` connectivity check;
- environment/API diagnostics;
- system responsibility diagram for Mobile → Backend → Web;
- complete W0–W6 delivery roadmap;
- responsive fleet-operations navigation;
- explicit phase placeholders for routes not yet connected.

Placeholders intentionally state that no mock operational data is rendered. The web dashboard should not accidentally normalize fake fleet values into the demo or research workflow.

## Navigation contract

Routes are allocated now so later implementation does not require restructuring the application shell:

```text
/                 W0 overview / foundation diagnostics
/live-fleet       W2
/alerts           W3
/safety-events    W4
/analytics        W4
/drivers          W5
/vehicles         W5
/devices          W5
/risk-policies    W5
/settings         W5
```

Authentication protection is not implemented in W0. W1 will introduce the unauthenticated login route and protect operator routes.

## Local development

With SafeFleet Backend running locally:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3001
```

The page should show Backend API `Reachable` when the backend liveness endpoint is available. If the backend is not running, W0 remains usable and shows the connection failure rather than crashing.

## Validation

```bash
npm run lint
npm test
npm run build
```

CI runs the same checks. W0 is complete only when all three are green.

## Security boundary

W0 contains no JWT storage and no management credentials. Authentication is added in W1 so token lifetime, protected routing, unauthorized handling, and role-aware navigation are implemented together rather than incrementally leaking auth state into unrelated foundation code.

## W0 acceptance criteria

W0 is complete when:

1. the app starts on port 3001;
2. production build succeeds;
3. lint and unit tests succeed;
4. browser navigation is responsive on desktop and narrow screens;
5. backend health is checked using `VITE_API_BASE_URL`;
6. unreachable backend state is handled without application failure;
7. no fabricated operational fleet data is presented;
8. W1–W6 route and documentation boundaries are explicit.

## Next phase — W1

W1 will implement organization-scoped login against `POST /api/v1/auth/login`, bootstrap the authenticated user with `GET /api/v1/auth/me`, persist the browser session with an explicit MVP token strategy, protect operator routes, and make navigation role-aware for the backend's current OWNER/ADMIN/SUPERVISOR/ANALYST/VIEWER role model.
