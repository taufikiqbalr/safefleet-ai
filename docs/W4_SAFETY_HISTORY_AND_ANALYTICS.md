# W4 — Safety History & Analytics

## Status

**Complete.** W4 adds the historical/research layer on top of the W1 authenticated session, W2 live fleet state, and W3 alert workflow.

## Objective

Provide tenant-scoped safety-event investigation, drowsiness measurement review, human feedback, nearby operational context, and descriptive analytics without changing or reinterpreting the backend measurements.

## Backend contracts

Safety history and review:

```text
GET  /api/v1/safety-events
GET  /api/v1/safety-events/:id
GET  /api/v1/drowsiness-events/:eventId
GET  /api/v1/safety-events/:id/feedback
POST /api/v1/safety-events/:id/feedback
GET  /api/v1/risk-snapshots
GET  /api/v1/telemetry
GET  /api/v1/sensor-readings
```

Analytics:

```text
GET /api/v1/analytics/overview
GET /api/v1/analytics/trends
GET /api/v1/analytics/models
GET /api/v1/analytics/latency
```

Reference labels are resolved from tenant-scoped driver, vehicle, device and user endpoints when the current backend role allows them.

## Safety-event explorer

`/safety-events` uses backend pagination and mirrors the current `SafetyEventQueryDto` filters:

```text
eventType
severity
deviceId
tripId
driverId
vehicleId
from
to
page
limit
```

The table displays:

- event type and source severity;
- drowsiness score when stored;
- driver and vehicle context;
- device and trip identity;
- model version;
- threshold profile;
- latest review classification for the currently loaded page;
- capture timestamp.

The backend safety-event list does not currently enrich each row with latest feedback. To expose review state without inventing a field, W4 loads `/safety-events/:id/feedback` for each event on the current page and displays the latest returned classification. This is intentionally limited to the current page and is documented in the UI. A future backend bulk/latest-feedback enrichment can remove the page-level N+1 calls without changing the screen contract.

## Event detail

`/safety-events/:eventId` combines the stored event with backend-derived context:

```text
SafetyEvent
  +-- Drowsiness detail when eventType=DROWSINESS
  +-- Feedback history
  +-- Matching risk snapshot when resolvable
  +-- Telemetry around capture
  +-- Sensor readings around capture
```

Telemetry and sensor context use a five-minute window before and after the event capture time and filter by trip when available, otherwise by authenticated-device identity stored on the event. The web client does not interpolate missing GPS or sensor values.

## Drowsiness evidence

For `DROWSINESS` events W4 displays backend-provided derived measurements when present:

- EAR (`eyeAspectRatio`);
- MAR (`mouthAspectRatio`);
- PERCLOS percentage;
- blink rate per minute;
- eye-closure duration;
- yawning state and duration;
- head pitch/yaw/roll;
- face-detected state;
- event drowsiness score;
- model version;
- threshold profile;
- inference latency.

The UI explicitly avoids universal-threshold claims. EAR, MAR, PERCLOS and temporal measurements are configuration and observation context; SafeFleet Web does not convert them into medical diagnoses or universal scientific cutoffs.

## Human review feedback

Backend classifications are used verbatim:

```text
CONFIRMED
FALSE_ALARM
UNCERTAIN
```

Mutation authority follows the backend controller:

```text
OWNER       review write
ADMIN       review write
SUPERVISOR  review write
ANALYST     review write
VIEWER      read-only
```

A review stores the backend-supported optional `reason`. Existing safety-event measurements remain immutable and are not overwritten by reviewer classification.

Feedback history shows the backend timestamp, classification, reviewer identity when that role can read the user list, and the stored reason. Viewer sessions do not request `/users` because the backend does not authorize VIEWER for that endpoint.

## Risk context

The backend exposes risk snapshots as a paginated list rather than `GET /risk-snapshots/:id`. W4 queries the most relevant trip/driver/vehicle snapshot page and matches by `safetyEventId`. If the exact event snapshot is not returned, the UI shows the context as unresolved; it never substitutes another event's risk snapshot.

Contributing factors are rendered as backend JSON without frontend re-weighting or reinterpretation.

## Analytics

`/analytics` requests all four Phase 4 analytics endpoints for one selected date range.

### Overview

The KPI layer displays backend-provided values including:

- total trips and driving hours;
- total safety events and drowsiness events;
- total, critical and active alerts;
- average acknowledgement and resolution time;
- reviewed event count;
- confirmed / false-alarm / uncertain latest-feedback counts;
- false-alarm rate among reviewed events;
- risk-snapshot distribution.

### Trends

The trend chart uses the backend `day` or `hour` bucket and shows safety-event count next to alert count. The selected tenant and time window are labelled explicitly.

### Model / threshold-profile groups

The comparison table displays exactly the dimensions returned by `/analytics/models`:

- model version;
- threshold profile;
- event count;
- latest-review classification counts;
- average mobile inference latency;
- average capture-to-backend ingestion delay.

The UI states that these are descriptive groups. It does not rank models, declare a winner, infer causal performance, or convert review counts into an unsupported accuracy claim.

### Latency

W4 displays sample count, average and p95 for:

- capture → backend receipt;
- backend receipt → risk calculation;
- backend receipt → initial alert.

`dashboardDelivery` is shown as unavailable when the backend returns no samples, preserving the Phase 4 backend statement that browser delivery acknowledgement is not yet collected.

## Realtime behavior

Safety history subscribes to the existing authenticated `/realtime` namespace and treats:

```text
safety.event.created
safety.event.feedback.created
```

as cache invalidations. The list is re-fetched through REST after a short debounce. Event detail also refreshes after matching feedback creation or `risk.updated` events. REST remains the canonical recovery source after reconnect.

Analytics remains an explicit snapshot for the selected historical range. Operators can refresh it manually; W4 does not continuously redraw historical charts on every device event.

## Error and empty states

W4 distinguishes:

- loading history versus empty query results;
- invalid/unavailable event detail;
- missing drowsiness detail;
- unresolved risk snapshot;
- no telemetry in the context window;
- no sensor reading in the context window;
- read-only feedback role;
- backend mutation/query error;
- expired HTTP session delegated to W1 logout;
- realtime connecting/synchronizing/ready/reconnecting/disconnected state.

## Tests

W4 adds unit coverage for:

- safety-event filter serialization;
- invalid date omission and date normalization;
- feedback mutation role boundaries;
- user-reference access boundary for VIEWER;
- analytics date-range serialization;
- trend-bucket serialization versus range-only endpoints.

W0–W3 tests remain in the same CI suite.

## Acceptance criteria

W4 is complete when:

1. `/safety-events` uses backend pagination and supported filters;
2. the current page exposes latest available review classification without fabricating list fields;
3. `/safety-events/:id` displays stored event identity and inference metadata;
4. drowsiness events display EAR/MAR/PERCLOS/blink/closure/yawn/head-pose measurements when present;
5. threshold/profile context is shown without universal-cutoff interpretation;
6. authorized roles can submit CONFIRMED/FALSE_ALARM/UNCERTAIN feedback while VIEWER remains read-only;
7. feedback history remains separate from immutable event measurements;
8. matching risk context is shown only when the exact event snapshot can be resolved;
9. nearby telemetry and generic sensor readings are available for investigation without invented values;
10. `/analytics` renders overview, trends, model/profile groups and latency from the backend;
11. every analytics view labels its selected time window and tenant-scoped population;
12. model groups are descriptive and are not ranked or declared scientifically superior;
13. lint, unit tests and production build are green.

## Next phase — W5

W5 moves from operational review to administration:

```text
fleet CRUD
driver CRUD
vehicle CRUD
device registration / credential rotation
assignment management
trip administration
user administration where role permits
risk-policy create / activate
organization settings
```

Every write control will follow the exact backend role decorator rather than relying on the broader navigation gates introduced in W1.
