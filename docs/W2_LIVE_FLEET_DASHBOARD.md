# W2 — Live Fleet Operations Dashboard

## Status

**Complete.** W2 replaces the foundation overview with real authenticated fleet state from SafeFleet Backend and adds the primary supervisor live-fleet surface.

## Backend contracts

```text
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/live-fleet?staleAfterSeconds=120
GET /api/v1/dashboard/active-alerts?limit=25
```

Every request uses the W1 JWT session. Tenant identity is never supplied by the browser; the backend derives the organization from the authenticated user.

## Overview dashboard

`/` now renders only backend-provided operational values:

- active trips;
- active alerts;
- online devices;
- safety events captured in the last 24 hours;
- alerts created in the last 24 hours;
- active driver count;
- active-alert severity distribution;
- latest-risk distribution for active trips;
- active-alert queue preview;
- live active-trip table;
- latest GPS map when coordinates are available.

Missing risk, GPS, speed, battery, network, or fleet values are rendered as explicit unavailable states. The frontend does not coerce absent values to zero or fabricate demo vehicles.

## Live fleet route

`/live-fleet` exposes the full loaded active-trip snapshot. Each row can display:

```text
driver / employee code
vehicle / plate
fleet
trip start
ONLINE / STALE / OFFLINE
latest seen
latest risk / risk score
active alert state
speed
battery
network
latitude / longitude
```

The backend `staleAfterSeconds` setting remains authoritative for connection classification. W2 currently requests 120 seconds, which is inside the backend-supported 30–3600 second range.

## Snapshot filters

W2 provides client-side filters for:

- driver / plate / fleet / device text search;
- risk level or missing risk snapshot;
- connection status;
- active-alert presence;
- fleet identity.

The UI explicitly says these filters apply to the currently loaded REST snapshot. It does not imply a server-wide search beyond the data returned by `/dashboard/live-fleet`.

## Fleet map

The map uses Leaflet with OpenStreetMap tiles. Only rows containing backend-provided valid latitude/longitude values receive markers. The marker overlay contains driver/vehicle context already returned by SafeFleet Backend; no GPS interpolation is generated.

Marker state communicates:

- latest risk level;
- ONLINE / STALE / OFFLINE opacity;
- selected trip context.

Selecting a marker selects the same trip context used by the tabular view. When no coordinates are available, the map shows no invented vehicle position.

The browser downloads OpenStreetMap tile imagery directly from the public tile service. A production deployment can replace this provider without changing the SafeFleet fleet-state contract.

## Realtime synchronization

W2 connects to the backend Socket.IO namespace:

```text
/realtime
```

with the W1 access token in `auth.token`. It waits for the backend `session.ready` event and verifies the returned organization ID before declaring realtime ready.

Events observed:

```text
telemetry.location.updated
safety.event.created
risk.updated
alert.created
alert.updated
sensor.reading.updated
```

For the MVP, realtime messages are treated as cache invalidations instead of being trusted as a second authoritative entity model. Relevant events trigger a debounced re-fetch of the three REST snapshots. Telemetry invalidations use a longer debounce than alert/risk events to avoid making one dashboard HTTP request per incoming location point.

On a Socket.IO reconnect, `session.ready` triggers a fresh REST synchronization before the UI returns to `ready`. This prevents a websocket outage from silently leaving gaps in fleet state.

## Realtime UI states

The operator can distinguish:

```text
connecting
synchronizing
ready
reconnecting
disconnected
```

The dashboard also displays the last successful synchronization time and most recent realtime invalidation event name. Tokens and authorization headers are never rendered.

## Error and empty states

W2 distinguishes:

- initial REST loading;
- no active trips;
- no active alerts;
- no risk snapshot;
- no GPS coordinates;
- recoverable backend refresh errors;
- expired HTTP session (`401`, delegated to W1 logout);
- websocket reconnecting/disconnected state.

A successful previous snapshot remains visible during a later refresh error so operators do not lose all context because of a transient request failure.

## Tests

W2 adds unit coverage for:

- numeric API normalization;
- valid/invalid GPS coordinate detection;
- risk and connection filtering;
- driver/vehicle/fleet text filtering;
- realtime base URL derivation from the versioned REST API URL.

W0/W1 tests remain in the same CI suite.

## Acceptance criteria

W2 is complete when:

1. the authenticated overview uses `/dashboard/summary`, `/dashboard/live-fleet`, and `/dashboard/active-alerts`;
2. `/live-fleet` renders actual backend active-trip data;
3. missing values are explicit instead of fabricated;
4. backend GPS points are visible on a fleet map;
5. loaded-snapshot filters work without changing tenant scope;
6. Socket.IO authenticates with the current W1 token;
7. realtime events refresh operational REST state without manual reload;
8. reconnect performs REST recovery before realtime is marked ready;
9. 401 responses return through the W1 session invalidation boundary;
10. lint, unit tests, and production build are green.

## Next phase — W3

W3 turns the active-alert preview into the full supervisor alert workflow:

```text
GET  /api/v1/alerts
GET  /api/v1/alerts/:id
GET  /api/v1/alerts/:id/history
POST /api/v1/alerts/:id/assign
POST /api/v1/alerts/:id/acknowledge
POST /api/v1/alerts/:id/escalate
POST /api/v1/alerts/:id/resolve
```

It will keep the W2 realtime invalidation/recovery strategy while adding alert detail, lifecycle history, ownership, notes, and role-aware actions.
