# W2 — Live Fleet Operations Dashboard

## Objective

Replace W0 foundation placeholders with real fleet operational state from the Phase 4 backend and establish the primary supervisor overview.

## Backend contracts

```text
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/live-fleet
GET /api/v1/dashboard/active-alerts
```

Realtime namespace/events available from the backend will be consumed after authenticated Socket.IO setup:

```text
/realtime
session.ready
telemetry.location.updated
safety.event.created
risk.updated
alert.created
alert.updated
sensor.reading.updated
```

## Dashboard summary

The summary surface should expose backend-provided values such as active trips, active alerts, recent safety-event counts, and risk distribution. The frontend must render returned values; it must not infer missing KPI semantics from unrelated counters.

## Live fleet state

Each live-fleet row/card is expected to present, when available:

- driver identity;
- vehicle identity/plate;
- active trip;
- latest latitude/longitude;
- speed;
- battery;
- network state;
- current risk level;
- active alert state;
- ONLINE / STALE / OFFLINE state;
- last update timestamp.

Missing values use explicit unavailable states rather than fake zeroes.

## Map

W2 will add a geospatial fleet view. Map provider/library selection remains an implementation decision, but the application contract is provider-neutral:

- plot only backend-provided coordinates;
- distinguish stale/offline location state;
- selecting a marker opens the same driver/vehicle/trip context used by the list;
- clustering is introduced if the number of visible vehicles makes individual markers unreadable;
- no location interpolation is presented as measured GPS.

## Realtime cache strategy

Initial page load comes from REST snapshots. Socket.IO then applies newer events to the in-memory view.

```text
REST snapshot
    |
    v
render current state
    |
    v
Socket.IO updates
    |
    v
patch affected entities
```

On reconnect, the app re-fetches the REST snapshot before accepting the connection as fully synchronized, preventing silent gaps during disconnection.

## Filters

Initial filters should include only dimensions supported cleanly by the API response/query contract, such as risk, connectivity, fleet, or alert state. Client-only filtering is acceptable for the currently loaded snapshot but must be labelled/implemented so it does not imply server-wide search.

## UX states

Every dashboard surface must have distinct:

- initial loading;
- empty fleet;
- backend error;
- websocket disconnected/reconnecting;
- stale vehicle data;
- offline vehicle data;
- no GPS available.

## Acceptance criteria

W2 is complete when an authenticated supervisor can open the dashboard, see real backend summary/live-fleet/active-alert data, receive realtime updates without manual refresh, recognize stale/offline data, and recover correctly after a temporary Socket.IO disconnect.
