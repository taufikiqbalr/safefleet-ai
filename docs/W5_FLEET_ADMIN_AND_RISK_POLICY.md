# W5 — Fleet Administration & Risk Policy

## Objective

Expose the backend's management APIs to authorized human operators while preserving tenant boundaries and role restrictions.

## Managed resources

W5 covers backend CRUD/lifecycle APIs for:

- organization settings;
- users;
- fleets;
- drivers;
- vehicles;
- devices;
- assignments;
- trips;
- risk policies.

## Device provisioning

The web admin workflow should support registering a device using the Android installation UUID as `deviceUid`, then rotating/issuing its device credential.

The backend returns the device secret once. The UI must therefore:

- clearly label it as one-time sensitive data;
- avoid storing it in browser persistence;
- avoid including it in logs/analytics/error traces;
- provide an explicit copy action;
- require a new rotation if the operator dismisses/loses it;
- never reuse the device secret as a human web session credential.

## Assignment/trip management

Administration pages provide the management-side lifecycle for driver/vehicle/device assignments and trips. Mobile M1 continues to use device-authenticated trip endpoints for in-vehicle operation.

## Risk policy management

Risk policy UI must preserve versioning semantics:

```text
DRAFT -> ACTIVE -> ARCHIVED
```

The editor displays operational mappings/configuration exactly as configured. It must not label a policy scientifically validated unless that status exists as explicit project metadata.

Activation should require a deliberate confirmation showing policy name/version and a readable summary of the changed operational mapping because activation changes subsequent risk processing.

## Role restrictions

Create/update/activation/device-secret operations are rendered only for roles allowed by backend authorization. Direct API responses remain authoritative, and 403 must be handled as a permission result rather than a generic crash.

## Audit visibility

Where backend audit endpoints allow it, W5 should expose mutation history for administrators/analysts so provisioning and configuration changes remain reviewable.

## Acceptance criteria

W5 is complete when authorized users can manage fleet entities, provision Android devices without leaking credentials, manage assignments/trips, create/version/activate risk policy, and receive correct forbidden states when their role is insufficient.
