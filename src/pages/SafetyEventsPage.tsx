import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import type { SafetyEventFilters } from '../safety/types';
import { useSafetyEvents } from '../safety/useSafetyEvents';

const EVENT_TYPES = ['DROWSINESS', 'CABIN_GAS', 'DRIVER_DISTRACTION', 'DEVICE_HEALTH'] as const;
const SEVERITIES = ['INFO', 'WARNING', 'HIGH', 'CRITICAL'] as const;

function formatTime(value: string | null | undefined): string {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date);
}

function shortId(value: string | null | undefined): string {
  if (!value) return 'Unavailable';
  return value.length > 12 ? `${value.slice(0, 8)}…` : value;
}

export function SafetyEventsPage() {
  const events = useSafetyEvents();
  const [draft, setDraft] = useState<SafetyEventFilters>(events.filters);
  const references = events.references;
  const driverById = useMemo(
    () => new Map(references?.drivers.map((item) => [item.id, `${item.fullName} (${item.employeeCode})`]) ?? []),
    [references],
  );
  const vehicleById = useMemo(
    () => new Map(references?.vehicles.map((item) => [item.id, item.plateNumber]) ?? []),
    [references],
  );
  const deviceById = useMemo(
    () => new Map(references?.devices.map((item) => [item.id, item.deviceUid]) ?? []),
    [references],
  );

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    events.setFilters({ ...draft, page: 1 });
  };

  const result = events.result;

  return (
    <div className="content-stack safety-page">
      <section className="operations-heading">
        <div>
          <div className="hero-kicker"><span className="status-pulse" />Phase W4 · Safety History</div>
          <h2>Historical safety observations from the backend.</h2>
          <p>
            Filters map to the backend safety-event query contract. Review status is loaded from each event's feedback history for the current page; measurements are never replaced by human feedback.
          </p>
        </div>
        <div className="operations-actions">
          <span className={`realtime-chip realtime-chip--${events.realtimeStatus}`}>{events.realtimeStatus}</span>
          <button className="button button--solid" type="button" onClick={() => void events.refresh()} disabled={events.refreshing}>
            {events.refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      <form className="safety-filter-panel" onSubmit={applyFilters}>
        <div className="safety-filter-grid">
          <label>
            <span>Event type</span>
            <select value={draft.eventType ?? ''} onChange={(e) => setDraft((current) => ({ ...current, eventType: (e.target.value || undefined) as SafetyEventFilters['eventType'] }))}>
              <option value="">All event types</option>
              {EVENT_TYPES.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Severity</span>
            <select value={draft.severity ?? ''} onChange={(e) => setDraft((current) => ({ ...current, severity: (e.target.value || undefined) as SafetyEventFilters['severity'] }))}>
              <option value="">All severities</option>
              {SEVERITIES.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Driver</span>
            <select value={draft.driverId ?? ''} onChange={(e) => setDraft((current) => ({ ...current, driverId: e.target.value || undefined }))}>
              <option value="">All loaded drivers</option>
              {references?.drivers.map((item) => <option key={item.id} value={item.id}>{item.fullName} · {item.employeeCode}</option>)}
            </select>
          </label>
          <label>
            <span>Vehicle</span>
            <select value={draft.vehicleId ?? ''} onChange={(e) => setDraft((current) => ({ ...current, vehicleId: e.target.value || undefined }))}>
              <option value="">All loaded vehicles</option>
              {references?.vehicles.map((item) => <option key={item.id} value={item.id}>{item.plateNumber}</option>)}
            </select>
          </label>
          <label>
            <span>Device</span>
            <select value={draft.deviceId ?? ''} onChange={(e) => setDraft((current) => ({ ...current, deviceId: e.target.value || undefined }))}>
              <option value="">All loaded devices</option>
              {references?.devices.map((item) => <option key={item.id} value={item.id}>{item.deviceUid}</option>)}
            </select>
          </label>
          <label>
            <span>Trip UUID</span>
            <input value={draft.tripId ?? ''} onChange={(e) => setDraft((current) => ({ ...current, tripId: e.target.value || undefined }))} placeholder="optional trip UUID" />
          </label>
          <label>
            <span>From</span>
            <input type="date" value={draft.from ?? ''} onChange={(e) => setDraft((current) => ({ ...current, from: e.target.value || undefined }))} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={draft.to ?? ''} onChange={(e) => setDraft((current) => ({ ...current, to: e.target.value || undefined }))} />
          </label>
        </div>
        <div className="safety-filter-actions">
          <button className="button button--solid" type="submit">Apply filters</button>
          <button className="button button--ghost" type="button" onClick={() => {
            const cleared: SafetyEventFilters = { page: 1, limit: events.filters.limit };
            setDraft(cleared);
            events.setFilters(cleared);
          }}>Clear</button>
          <span>Server pagination · current page feedback status</span>
        </div>
      </form>

      {events.error ? <div className="inline-warning"><strong>History refresh issue:</strong> {events.error}</div> : null}

      {events.loading ? (
        <div className="operations-state"><div className="loading-ring" /><h2>Loading safety history</h2><p>Fetching tenant-scoped events from SafeFleet Backend.</p></div>
      ) : result && result.items.length > 0 ? (
        <section className="operations-panel">
          <div className="operations-panel-heading">
            <div><span className="eyebrow">Safety event explorer</span><h3>{result.meta.total} matching events</h3></div>
            <span className="muted-count">Page {result.meta.page} / {Math.max(1, result.meta.totalPages)}</span>
          </div>
          <div className="fleet-table-wrap">
            <table className="fleet-table safety-event-table">
              <thead>
                <tr><th>Event</th><th>Driver / vehicle</th><th>Device / trip</th><th>Model context</th><th>Review</th><th>Captured</th></tr>
              </thead>
              <tbody>
                {result.items.map((item) => {
                  const review = events.reviewStateByEventId[item.id];
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link className="event-title-link" to={`/safety-events/${item.id}`}><strong>{item.eventType}</strong></Link>
                        <span><span className={`event-severity event-severity--${item.severity.toLowerCase()}`}>{item.severity}</span>{item.drowsinessScore === null ? '' : ` · score ${item.drowsinessScore}`}</span>
                      </td>
                      <td><strong>{item.driverId ? driverById.get(item.driverId) ?? shortId(item.driverId) : 'Driver unavailable'}</strong><span>{item.vehicleId ? vehicleById.get(item.vehicleId) ?? shortId(item.vehicleId) : 'Vehicle unavailable'}</span></td>
                      <td><strong>{deviceById.get(item.deviceId) ?? shortId(item.deviceId)}</strong><span>{item.tripId ? shortId(item.tripId) : 'No trip'}</span></td>
                      <td><strong>{item.modelVersion ?? 'Model unavailable'}</strong><span>{item.thresholdProfile ?? 'Threshold profile unavailable'}</span></td>
                      <td><span className={`review-chip review-chip--${(review ?? 'unreviewed').toLowerCase()}`}>{review ?? 'UNREVIEWED'}</span></td>
                      <td>{formatTime(item.capturedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination-row">
            <button type="button" className="button button--ghost" disabled={result.meta.page <= 1} onClick={() => events.setFilters({ page: result.meta.page - 1 })}>Previous</button>
            <span>{result.meta.total} records · {result.meta.limit} per page</span>
            <button type="button" className="button button--ghost" disabled={result.meta.page >= result.meta.totalPages} onClick={() => events.setFilters({ page: result.meta.page + 1 })}>Next</button>
          </div>
        </section>
      ) : (
        <div className="operations-state"><h2>No safety events found</h2><p>The current backend query returned an empty page. Adjust filters or wait for device ingestion.</p></div>
      )}

      <footer className="snapshot-footer">
        <span>Last synchronized: {events.lastSynchronizedAt ? events.lastSynchronizedAt.toLocaleTimeString() : 'Not yet'}</span>
        <span>Review status is loaded only for this page; aggregate feedback belongs to Analytics.</span>
      </footer>
    </div>
  );
}
