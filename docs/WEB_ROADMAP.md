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
W4 Safety History & Analytics         ✅
   |
   v
W5 Fleet Administration & Risk Policy NEXT
   |
   v
W6 Validation & Release Hardening
```

Each phase has its own detailed contract under `docs/`. A phase is complete only when implementation, tests, documentation and CI validation are all green.

## MVP boundary

For the current SafeFleet hackathon/research MVP, W0 through W4 are now implemented as the primary operator experience. W5 is needed when the web app must administer fleet entities, device provisioning, assignments/trips, users and risk policy directly. W6 is the release-hardening boundary.

After W4 the web console can authenticate an operator, monitor active fleet state, execute the backend alert lifecycle, investigate historical safety events, review drowsiness evidence, submit human feedback and inspect backend analytics/latency without inventing unsupported model or safety interpretations.

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
