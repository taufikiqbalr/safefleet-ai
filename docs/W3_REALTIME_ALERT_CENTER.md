# W3 — Realtime Alert Center

## Status

**Complete.** W3 turns SafeFleet alerts into a persistent, auditable supervisor workflow rather than a passive dashboard preview.

## Objective

Provide a tenant-scoped queue where operators can inspect alert context and history, while authorized supervisor roles can assign, acknowledge, escalate and resolve alerts using the backend lifecycle contract.

## Backend contracts

```text
GET  /api/v1/alerts
GET  /api/v1/alerts/:id
GET  /api/v1/alerts/:id/history
POST /api/v1/alerts/:id/assign
POST /api/v1/alerts/:id/acknowledge
POST /api/v1/alerts/:id/escalate
POST /api/v1/alerts/:id/resolve
```

Supporting context used by W3:

```text
GET /api/v1/drivers
GET /api/v1/vehicles
GET /api/v1/users
GET /api/v1/safety-events/:id
GET /api/v1/risk-snapshots
```

`/users` is not requested for the `VIEWER` role because the backend does not authorize that role for the user list. Driver/vehicle context remains readable through their management GET contracts.

## Queue implementation

`/alerts` now renders the paginated backend alert collection. Server-compatible filters include:

- status;
- severity;
- driver;
- vehicle;
- assignee when the current role can list users;
- trip UUID;
- from/to creation time;
- page and limit.

The filter controls deliberately mirror parameters currently accepted by `AlertQueryDto`. Device filtering is not invented because the current backend alert query does not expose `deviceId`.

Queue rows show:

```text
severity
status
alert type/title
trip reference
driver
vehicle
occurrence count
assignee
last event timestamp
```

Driver, vehicle and assignee labels are resolved from tenant-scoped reference lists when available. If a reference falls outside the loaded reference page or cannot be read by the current role, the UI displays a shortened backend UUID instead of fabricating a name.

## Alert detail

`/alerts/:alertId` combines the backend alert record with:

- complete alert status history;
- driver/vehicle reference context;
- originating safety event when `safetyEventId` is present and retrievable;
- matching risk snapshot when the current `risk-snapshots` query can resolve `riskSnapshotId`;
- assignee/actor names when the backend role allows user-list access.

Safety-event detail includes backend-provided event type, source severity, capture time, drowsiness score, local-alarm state, threshold profile, model version and inference latency when present.

Risk detail renders the backend risk level, score, policy version, calculation time and raw `contributingFactors` JSON. The web interface explicitly presents these as driver-safety/policy observations and does not reinterpret them as a medical diagnosis.

The backend currently exposes risk snapshots through a list endpoint rather than `GET /risk-snapshots/:id`. W3 therefore searches the most relevant tenant-scoped snapshot list and leaves the risk snapshot as unresolved when the referenced ID is not returned; it does not substitute another snapshot.

## Supervisor lifecycle actions

Mutation authority follows the backend controller exactly:

```text
OWNER
ADMIN
SUPERVISOR
```

`ANALYST` and `VIEWER` receive read-only alert detail.

Assignment accepts an active tenant user and can also be cleared. The UI sends the backend `userId` plus an optional operational assignment note. Assignment metadata does not invent a lifecycle status; the backend alert status remains `OPEN`, `ACKNOWLEDGED`, `ESCALATED`, or `RESOLVED`.

Lifecycle controls are derived from the returned alert state and the currently implemented backend service behavior:

- resolved alerts cannot be reassigned, acknowledged, escalated or resolved again from the UI;
- already acknowledged alerts do not show another acknowledge operation;
- already escalated alerts do not show another escalate operation;
- any other non-resolved alert may use the transition endpoint currently accepted by the backend.

Every mutation asks for confirmation, preserves the last server snapshot on failure, shows the backend error, and re-fetches alert detail/history after success.

## Realtime behavior

W3 connects to the existing authenticated Socket.IO namespace:

```text
/realtime
```

using the W1 access token in `auth.token` and verifies `session.ready.organizationId` before marking realtime as synchronized.

Queue behavior:

- `alert.created` triggers a debounced REST queue refresh;
- `alert.updated` triggers a debounced REST queue refresh;
- repeated socket events cannot duplicate rows because REST remains the canonical queue source;
- reconnect performs a fresh REST synchronization before status returns to `ready`.

Detail behavior:

- matching `alert.updated` messages refresh the selected record and history;
- action responses are reconciled again through REST, so user-initiated mutations and subsequent Socket.IO updates converge on server state.

## Attention cues

A newly received `WARNING` or `CRITICAL` `alert.created` message produces an in-app attention banner with a direct link to the alert detail. This cue is supplemental; the persistent `/alerts` queue remains authoritative. Browser/OS notification permission is not requested in W3.

## Error and empty states

W3 distinguishes:

- initial queue loading;
- empty query results;
- reference values unavailable to the current role;
- backend query/mutation errors;
- HTTP `401`, delegated to the W1 logout/session-invalid boundary;
- Socket.IO connecting/synchronizing/ready/reconnecting/disconnected states;
- missing safety-event context;
- unresolved risk-snapshot reference.

## Tests

W3 adds unit coverage for:

- alert mutation role checks;
- resolved-alert action disabling;
- lifecycle action availability for current backend states;
- serialization of backend-supported alert filters;
- date-filter normalization and invalid-date omission.

W0–W2 tests remain in the same CI suite.

## Acceptance criteria

W3 is complete when:

1. `/alerts` lists tenant-scoped backend alerts with pagination;
2. supported alert filters map to backend query parameters;
3. realtime `alert.created` and `alert.updated` invalidate and refresh the queue;
4. WARNING/CRITICAL creation produces an in-app attention cue;
5. `/alerts/:id` shows the alert record and status-history timeline;
6. available safety-event/risk context is shown without invented interpretation;
7. OWNER/ADMIN/SUPERVISOR can assign/unassign alerts;
8. authorized operators can acknowledge, escalate and resolve according to returned state;
9. ANALYST/VIEWER remain read-only;
10. failed mutations keep the prior snapshot and expose a retryable backend error;
11. reconnect re-synchronizes from REST;
12. lint, unit tests and production build are green.

## Next phase — W4

W4 expands from individual operational alerts into historical safety analysis:

```text
GET /api/v1/safety-events
GET /api/v1/drowsiness-events/:eventId
GET /api/v1/safety-events/:id/feedback
POST /api/v1/safety-events/:id/feedback
GET /api/v1/analytics/overview
GET /api/v1/analytics/trends
GET /api/v1/analytics/models
GET /api/v1/analytics/latency
```

The goal is event history, drowsiness evidence, review feedback, false-alarm analysis, trend/model comparison and latency visibility while preserving the backend's measured-data semantics.
