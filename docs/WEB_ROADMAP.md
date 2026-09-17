# SafeFleet AI Web — Delivery Roadmap

SafeFleet Web is the fleet/supervisor operations surface. It does not perform driver-state inference; it consumes authenticated backend state and realtime events produced by SafeFleet Backend.

## Phase dependency chain

```text
W0 Foundation                         ✅
   |
   v
W1 Authentication                     ✅
   |
   v
W2 Live Fleet Dashboard               ✅
   |
   v
W3 Realtime Alert Center              ✅
   |
   v
W4 Safety History & Analytics         NEXT
   |
   v
W5 Fleet Administration & Risk Policy
   |
   v
W6 Validation & Release Hardening
```

Each phase has its own detailed contract under `docs/`. A phase is complete only when implementation, tests, documentation and CI validation are all green.

## MVP boundary

For the current SafeFleet hackathon/research MVP, W0 through W4 are the primary operator experience. W5 is needed when the web app must administer fleet entities and risk policy directly. W6 is the release-hardening boundary.

After W3 the web console can authenticate an operator, monitor active fleet state and execute the backend alert lifecycle. W4 adds the historical/research analysis surface required to evaluate safety-event quality, feedback, trends and latency.

## Cross-repository boundaries

```text
safefleet-ai_mobile
  camera + local inference + immediate alarm + device telemetry

safefleet-ai_backend
  user/device auth + persistence + risk + alerts + realtime + analytics

safefleet-ai
  human supervisor/fleet operations + analysis + administration
```

The web application must never use or store Android device credentials. Human browser access uses the backend user JWT model only.
