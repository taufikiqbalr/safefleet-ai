# W6 — Validation & Release Hardening

## Objective

Convert the integrated SafeFleet Web MVP into a repeatable release with tested critical operator journeys, accessible interaction, explicit production configuration, and operational failure handling.

## Automated validation

W6 adds browser E2E coverage (for example with Playwright) for critical journeys:

```text
login
 -> dashboard loads
 -> live fleet visible
 -> alert opens
 -> assign/acknowledge/resolve
 -> history reflects action
 -> logout
```

Additional tests cover expired sessions, backend 500/timeout, Socket.IO disconnect/reconnect, empty datasets, and forbidden administration actions.

## Accessibility

Validation includes:

- keyboard-only navigation;
- visible focus states;
- semantic headings/landmarks;
- labels for form controls;
- status information not conveyed by color alone;
- sufficient contrast;
- table/card behavior at browser zoom;
- screen-reader-readable alert/risk labels.

## Responsive behavior

Primary target remains fleet-operations desktop/laptop, but essential monitoring/action flows must remain usable at common tablet widths. Narrow mobile browser layouts are supported for emergency review, not as a replacement for SafeFleet Mobile.

## Security hardening

- production HTTPS only;
- no secrets in `VITE_*` environment variables;
- no JWT/device secrets in logs or URLs;
- controlled Content Security Policy where hosting permits it;
- dependency/security review;
- safe external-link behavior;
- explicit session expiry handling;
- production CORS/origin alignment with backend deployment.

## Resilience

- route-level error boundaries;
- recoverable failed queries/mutations;
- realtime reconnect state;
- snapshot refresh after reconnect;
- stale data indicators;
- clock/timezone formatting policy;
- large-list pagination/virtualization when fleet size requires it.

## Performance

W6 records a practical performance budget for initial JS/CSS load and critical dashboard render. Heavy map/chart dependencies should be route-split where possible.

## Deployment

The repository documents one supported production deployment path with:

- build command;
- required environment variables;
- SPA route fallback;
- backend API/realtime origin;
- TLS/custom-domain expectations;
- cache policy for hashed assets versus `index.html`;
- rollback procedure.

## Acceptance criteria

W6 is complete when critical operator E2E tests are green, accessibility and responsive checks are documented, production configuration is explicit, deployment is repeatable, and known limitations are listed for the final demo/release.
