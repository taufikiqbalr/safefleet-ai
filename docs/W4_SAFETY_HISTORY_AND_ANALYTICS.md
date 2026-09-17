# W4 — Safety History & Analytics

## Objective

Provide fleet review, research support, and historical investigation using stored safety events, drowsiness metrics, feedback, risk snapshots, telemetry/sensor history, and backend analytics.

## Primary backend contracts

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

## Safety-event explorer

Search/filter views should expose event type, severity, driver, vehicle, trip, device, captured time, model version and available review status. Pagination must follow backend metadata rather than loading the entire history into the browser.

## Drowsiness detail

For drowsiness events the web can display derived metrics supplied by Android/backend, including when present:

- EAR;
- MAR;
- PERCLOS;
- blink rate;
- eye-closure duration;
- yawning/yawn duration;
- head pitch/yaw/roll;
- face-detected state;
- drowsiness score;
- model version;
- threshold profile;
- inference latency.

The UI does not invent universal threshold interpretations. Threshold/profile values are displayed as configuration/context, not as scientifically universal cutoffs.

## Human review feedback

Supported classification:

```text
CONFIRMED
FALSE_ALARM
UNCERTAIN
```

Feedback UI records the backend-supported reason/note and preserves event history. Existing event measurements are not overwritten.

## Analytics

W4 visualizations should cover data actually returned by the backend:

- event/risk/alert trends;
- model-version comparison;
- threshold-profile comparison when supported by returned dimensions;
- inference/ingestion latency;
- feedback classification summaries;
- date-range and entity filters.

Charts must label population/time range and avoid implying causality or model accuracy beyond the measured dataset.

## Drill-down

Analytics points/tables should link back to underlying event/driver/vehicle/trip views where the API supports the relationship. This keeps aggregate numbers auditable.

## Acceptance criteria

W4 is complete when an analyst/supervisor can filter historical safety events, inspect a drowsiness event's detailed measurements, submit review feedback, examine backend analytics/trends/models/latency, and navigate from aggregates to supporting records.
