# W3 — Realtime Alert Center

## Objective

Turn backend alerts into an auditable supervisor workflow rather than a passive notification list.

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

Realtime alert creation/update events are consumed from `/realtime`.

## Alert queue

The queue should support backend-compatible filters for status, risk/severity, trip, driver, vehicle, device, assignee, and time range where those query parameters exist.

Queue rows should show operationally important fields without forcing detail navigation:

- risk/severity;
- lifecycle status;
- driver/vehicle;
- first/last event time;
- occurrence count;
- assignee;
- trip context.

## Detail view

Alert details should combine:

- alert record;
- risk snapshot and contributing factors when returned;
- originating/latest safety-event context;
- driver/vehicle/trip references;
- complete alert action/history timeline.

The UI should explain backend-provided contributing factors but must not reinterpret operational risk as a medical diagnosis.

## Actions

Supervisor actions:

```text
OPEN -> ASSIGNED (assignee metadata)
OPEN -> ACKNOWLEDGED
OPEN/ACKNOWLEDGED -> ESCALATED
OPEN/ACKNOWLEDGED/ESCALATED -> RESOLVED
```

The exact backend lifecycle remains authoritative. Buttons are enabled from returned state and role, not from optimistic assumptions.

Every mutation uses a clear confirmation/result state. A failed mutation must preserve the previous server state and show an actionable retry/error message.

## Realtime behavior

- `alert.created` inserts or refreshes a queue record;
- `alert.updated` refreshes affected alert detail/queue data;
- dashboard alert counts are invalidated/refetched;
- duplicate socket events must not create duplicate rows;
- actions initiated by the current user reconcile with subsequent realtime updates.

## Notification UX

W3 includes in-app attention cues for newly created CRITICAL/WARNING alerts. Browser/OS notifications are optional and require explicit permission; they are not a substitute for the persistent alert queue.

## Acceptance criteria

W3 is complete when a supervisor can receive an alert in realtime, open its detail/history, assign it, acknowledge/escalate when allowed, resolve it, and observe the final state/history consistently across refresh/reconnect.
