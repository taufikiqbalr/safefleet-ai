import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useAlertCenter } from '../alerts/useAlertCenter';
import type { AlertFilters, AlertRecord, AlertSeverity, AlertStatus } from '../alerts/types';

const DEFAULT_FILTERS: AlertFilters = { page: 1, limit: 20 };

function formatTime(value: string | null | undefined): string {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

function shortId(value: string | null | undefined): string {
  if (!value) return 'Unassigned';
  return `${value.slice(0, 8)}…`;
}

export function AlertCenterPage() {
  const auth = useAuth();
  const [filters, setFilters] = useState<AlertFilters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<AlertFilters>(DEFAULT_FILTERS);
  const center = useAlertCenter(filters);

  const driverById = useMemo(
    () => new Map(center.references.drivers.map((item) => [item.id, item])),
    [center.references.drivers],
  );
  const vehicleById = useMemo(
    () => new Map(center.references.vehicles.map((item) => [item.id, item])),
    [center.references.vehicles],
  );
  const userById = useMemo(
    () => new Map(center.references.users.map((item) => [item.id, item])),
    [center.references.users],
  );

  const submitFilters = (event: FormEvent) => {
    event.preventDefault();
    setFilters({ ...draft, page: 1, limit: filters.limit });
  };

  const resetFilters = () => {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  };

  const changePage = (page: number) => {
    const next = { ...filters, page };
    setFilters(next);
    setDraft((current) => ({ ...current, page }));
  };

  if (center.loading) {
    return <div className="operations-state"><div className="loading-ring" /><h2>Loading alert center</h2><p>Fetching the tenant-scoped alert queue and supervisor reference data.</p></div>;
  }

  if (center.error && !center.queue) {
    return (
      <div className="operations-state operations-state--error">
        <h2>Alert center unavailable</h2>
        <p>{center.error}</p>
        <button className="button button--solid" type="button" onClick={() => void center.refresh()}>Retry alert center</button>
      </div>
    );
  }

  const queue = center.queue!;

  return (
    <div className="content-stack alert-center">
      <section className="operations-heading">
        <div>
          <div className="hero-kicker"><span className="status-pulse" />Phase W3 · Realtime Alert Center</div>
          <h2>Auditable supervisor workflow for fleet safety alerts.</h2>
          <p>Queue state comes from the alert API. Realtime creation/update events invalidate and refresh the server snapshot instead of creating duplicate local records.</p>
        </div>
        <div className="operations-actions">
          <span className={`realtime-chip realtime-chip--${center.realtimeStatus}`}>{center.realtimeStatus}</span>
          <button className="button button--solid" type="button" onClick={() => void center.refresh()} disabled={center.refreshing}>
            {center.refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      {center.attention ? (
        <div className={`alert-attention alert-attention--${center.attention.severity.toLowerCase()}`}>
          <div><strong>New {center.attention.severity} alert</strong><span>{center.attention.title}</span></div>
          <div className="alert-attention-actions">
            <Link className="button button--solid" to={`/alerts/${center.attention.id}`}>Open alert</Link>
            <button className="button button--ghost" type="button" onClick={center.dismissAttention}>Dismiss</button>
          </div>
        </div>
      ) : null}

      {center.error ? <div className="inline-warning"><strong>Last refresh issue:</strong> {center.error}</div> : null}

      <section className="operations-panel">
        <div className="operations-panel-heading">
          <div><span className="eyebrow">Backend-compatible query</span><h3>Alert filters</h3></div>
          <span className="muted-count">{queue.meta.total} total</span>
        </div>
        <form className="alert-filter-grid" onSubmit={submitFilters}>
          <label>Status<select value={draft.status ?? ''} onChange={(event) => setDraft((current) => ({ ...current, status: (event.target.value || undefined) as AlertStatus | undefined }))}>
            <option value="">All statuses</option><option value="OPEN">OPEN</option><option value="ACKNOWLEDGED">ACKNOWLEDGED</option><option value="ESCALATED">ESCALATED</option><option value="RESOLVED">RESOLVED</option>
          </select></label>
          <label>Severity<select value={draft.severity ?? ''} onChange={(event) => setDraft((current) => ({ ...current, severity: (event.target.value || undefined) as AlertSeverity | undefined }))}>
            <option value="">All severities</option><option value="NORMAL">NORMAL</option><option value="CAUTION">CAUTION</option><option value="WARNING">WARNING</option><option value="CRITICAL">CRITICAL</option>
          </select></label>
          <label>Driver<select value={draft.driverId ?? ''} onChange={(event) => setDraft((current) => ({ ...current, driverId: event.target.value || undefined }))}>
            <option value="">All drivers</option>{center.references.drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.fullName} · {driver.employeeCode}</option>)}
          </select></label>
          <label>Vehicle<select value={draft.vehicleId ?? ''} onChange={(event) => setDraft((current) => ({ ...current, vehicleId: event.target.value || undefined }))}>
            <option value="">All vehicles</option>{center.references.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plateNumber}</option>)}
          </select></label>
          {auth.session?.user.role !== 'VIEWER' ? <label>Assignee<select value={draft.assignedToUserId ?? ''} onChange={(event) => setDraft((current) => ({ ...current, assignedToUserId: event.target.value || undefined }))}>
            <option value="">All assignees</option>{center.references.users.filter((user) => user.status === 'ACTIVE').map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}
          </select></label> : null}
          <label>From<input type="datetime-local" value={draft.from ?? ''} onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value || undefined }))} /></label>
          <label>To<input type="datetime-local" value={draft.to ?? ''} onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value || undefined }))} /></label>
          <label>Trip ID<input value={draft.tripId ?? ''} placeholder="Optional UUID" onChange={(event) => setDraft((current) => ({ ...current, tripId: event.target.value.trim() || undefined }))} /></label>
          <div className="alert-filter-actions"><button className="button button--solid" type="submit">Apply filters</button><button className="button button--ghost" type="button" onClick={resetFilters}>Reset</button></div>
        </form>
      </section>

      <section className="operations-panel">
        <div className="operations-panel-heading">
          <div><span className="eyebrow">Tenant alert queue</span><h3>Alerts</h3></div>
          <span className="muted-count">Page {queue.meta.page} / {Math.max(queue.meta.totalPages, 1)}</span>
        </div>
        {queue.items.length === 0 ? <p className="empty-inline">No alerts match the current backend query.</p> : (
          <div className="alert-table-wrap">
            <table className="alert-table">
              <thead><tr><th>Severity / status</th><th>Alert</th><th>Driver / vehicle</th><th>Occurrences</th><th>Assignee</th><th>Last event</th><th /></tr></thead>
              <tbody>{queue.items.map((alert) => {
                const driver = alert.driverId ? driverById.get(alert.driverId) : undefined;
                const vehicle = alert.vehicleId ? vehicleById.get(alert.vehicleId) : undefined;
                const assignee = alert.assignedToUserId ? userById.get(alert.assignedToUserId) : undefined;
                return <AlertQueueRow key={alert.id} alert={alert} driver={driver?.fullName} vehicle={vehicle?.plateNumber} assignee={assignee?.fullName ?? shortId(alert.assignedToUserId)} />;
              })}</tbody>
            </table>
          </div>
        )}
        <div className="pagination-row">
          <span>{queue.meta.total} alert records · limit {queue.meta.limit}</span>
          <div><button className="button button--ghost" type="button" disabled={queue.meta.page <= 1} onClick={() => changePage(queue.meta.page - 1)}>Previous</button><button className="button button--ghost" type="button" disabled={queue.meta.page >= queue.meta.totalPages} onClick={() => changePage(queue.meta.page + 1)}>Next</button></div>
        </div>
      </section>

      <footer className="snapshot-footer">
        <span>Last synchronized: {center.lastSynchronizedAt ? center.lastSynchronizedAt.toLocaleTimeString() : 'Not yet'}</span>
        <span>Last realtime event: {center.lastRealtimeEvent ?? 'None since page load'}</span>
      </footer>
    </div>
  );
}

function AlertQueueRow({ alert, driver, vehicle, assignee }: { alert: AlertRecord; driver?: string; vehicle?: string; assignee: string }) {
  return (
    <tr>
      <td><span className={`risk-pill risk-pill--${alert.severity.toLowerCase()}`}>{alert.severity}</span><span className={`alert-status alert-status--${alert.status.toLowerCase()}`}>{alert.status}</span></td>
      <td><strong>{alert.title}</strong><span>{alert.alertType} · {shortId(alert.tripId)}</span></td>
      <td><strong>{driver ?? shortId(alert.driverId)}</strong><span>{vehicle ?? shortId(alert.vehicleId)}</span></td>
      <td>{alert.occurrenceCount}</td>
      <td>{assignee}</td>
      <td>{formatTime(alert.lastEventAt)}</td>
      <td><Link className="text-link" to={`/alerts/${alert.id}`}>Open →</Link></td>
    </tr>
  );
}
