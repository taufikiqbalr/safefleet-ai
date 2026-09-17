import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { FleetMap } from '../components/FleetMap';
import { hasCoordinates, toFiniteNumber } from '../dashboard/filters';
import type { ActiveAlert, LiveFleetItem, RealtimeStatus } from '../dashboard/types';
import { useFleetOperations } from '../dashboard/useFleetOperations';

function formatTime(value: string | null | undefined): string {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date);
}

function formatNumeric(value: number | string | null | undefined, suffix = '', digits = 0): string {
  const number = toFiniteNumber(value);
  return number === null ? 'Unavailable' : `${number.toFixed(digits)}${suffix}`;
}

function RealtimeChip({ status }: { status: RealtimeStatus }) {
  return <span className={`realtime-chip realtime-chip--${status}`}>{status.replace('_', ' ')}</span>;
}

function FleetContext({ item }: { item: LiveFleetItem }) {
  return (
    <div className="selected-fleet-context">
      <div>
        <span className="eyebrow">Selected vehicle</span>
        <strong>{item.plateNumber}</strong>
        <small>{item.driverName} · {item.driverCode}</small>
      </div>
      <div className="context-badges">
        <span className={`risk-pill risk-pill--${(item.riskLevel ?? 'unknown').toLowerCase()}`}>{item.riskLevel ?? 'NO RISK'}</span>
        <span className={`connection-pill connection-pill--${item.connectionStatus.toLowerCase()}`}>{item.connectionStatus}</span>
      </div>
      <dl className="compact-details">
        <div><dt>Speed</dt><dd>{formatNumeric(item.speedKph, ' km/h', 1)}</dd></div>
        <div><dt>Battery</dt><dd>{item.batteryPercent === null ? 'Unavailable' : `${item.batteryPercent}%`}</dd></div>
        <div><dt>Network</dt><dd>{item.networkType ?? 'Unavailable'}</dd></div>
        <div><dt>Last seen</dt><dd>{formatTime(item.latestSeenAt)}</dd></div>
      </dl>
    </div>
  );
}

function AlertRow({ alert }: { alert: ActiveAlert }) {
  return (
    <article className="alert-preview-row">
      <span className={`severity-dot severity-dot--${alert.severity.toLowerCase()}`} />
      <div>
        <strong>{alert.title}</strong>
        <span>{alert.driverName ?? 'Driver unavailable'} · {alert.plateNumber ?? 'Vehicle unavailable'}</span>
      </div>
      <div className="alert-preview-meta">
        <strong>{alert.severity}</strong>
        <span>{formatTime(alert.lastEventAt)}</span>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const operations = useFleetOperations();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const liveItems = operations.liveFleet?.items ?? [];
  const selectedItem = useMemo(
    () => liveItems.find((item) => item.tripId === selectedTripId) ?? null,
    [liveItems, selectedTripId],
  );
  const mappedItems = useMemo(() => liveItems.filter(hasCoordinates), [liveItems]);

  if (operations.loading) {
    return <div className="operations-state"><div className="loading-ring" /><h2>Loading fleet operations</h2><p>Fetching the authenticated dashboard snapshot from SafeFleet Backend.</p></div>;
  }

  if (operations.error && !operations.summary) {
    return (
      <div className="operations-state operations-state--error">
        <h2>Fleet operations unavailable</h2>
        <p>{operations.error}</p>
        <button className="button button--solid" type="button" onClick={() => void operations.refresh()}>Retry dashboard</button>
      </div>
    );
  }

  const summary = operations.summary!;
  const alerts = operations.activeAlerts?.items ?? [];

  return (
    <div className="content-stack operations-dashboard">
      <section className="operations-heading">
        <div>
          <div className="hero-kicker"><span className="status-pulse" />Phase W2 · Live Fleet Operations</div>
          <h2>Current fleet safety state from the backend.</h2>
          <p>REST snapshots are the recovery source. Socket.IO events invalidate the current snapshot and trigger synchronized refreshes.</p>
        </div>
        <div className="operations-actions">
          <RealtimeChip status={operations.realtimeStatus} />
          <button className="button button--solid" type="button" onClick={() => void operations.refresh()} disabled={operations.refreshing}>
            {operations.refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      {operations.error ? <div className="inline-warning"><strong>Last refresh issue:</strong> {operations.error}</div> : null}

      <section className="operations-kpis" aria-label="Fleet summary">
        <article><span>Active trips</span><strong>{summary.activeTrips}</strong><small>Current ACTIVE trips</small></article>
        <article><span>Active alerts</span><strong>{summary.activeAlerts}</strong><small>Open / acknowledged / escalated</small></article>
        <article><span>Online devices</span><strong>{summary.onlineDevices}</strong><small>Backend summary window</small></article>
        <article><span>Safety events 24h</span><strong>{summary.safetyEvents24h}</strong><small>Captured in the last 24 hours</small></article>
        <article><span>Alerts 24h</span><strong>{summary.alerts24h}</strong><small>Created in the last 24 hours</small></article>
        <article><span>Active drivers</span><strong>{summary.activeDrivers}</strong><small>Active driver records</small></article>
      </section>

      <section className="operations-grid operations-grid--map">
        <article className="operations-panel operations-map-panel">
          <div className="operations-panel-heading">
            <div><span className="eyebrow">Geospatial state</span><h3>Live fleet map</h3></div>
            <span className="muted-count">{mappedItems.length} with GPS</span>
          </div>
          <FleetMap items={liveItems} selectedTripId={selectedTripId} onSelect={setSelectedTripId} />
          {mappedItems.length === 0 ? <p className="empty-inline">No active trip currently has backend-provided GPS coordinates.</p> : null}
          {selectedItem ? <FleetContext item={selectedItem} /> : null}
        </article>

        <article className="operations-panel">
          <div className="operations-panel-heading">
            <div><span className="eyebrow">Risk posture</span><h3>Active trips by latest risk</h3></div>
          </div>
          <div className="risk-distribution">
            {summary.activeTripsByLatestRisk.length === 0 ? <p className="empty-inline">No risk snapshot is available for active trips.</p> : summary.activeTripsByLatestRisk.map((item) => (
              <div className="risk-distribution-row" key={item.riskLevel}>
                <span className={`risk-pill risk-pill--${item.riskLevel.toLowerCase()}`}>{item.riskLevel}</span>
                <div><span style={{ width: `${summary.activeTrips > 0 ? Math.max(6, (item.count / summary.activeTrips) * 100) : 0}%` }} /></div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
          <div className="operations-panel-heading compact-heading">
            <div><span className="eyebrow">Alert posture</span><h3>Active alerts by severity</h3></div>
          </div>
          <div className="severity-list">
            {summary.activeAlertsBySeverity.length === 0 ? <p className="empty-inline">No active alerts.</p> : summary.activeAlertsBySeverity.map((item) => (
              <div key={item.severity}><span className={`severity-dot severity-dot--${item.severity.toLowerCase()}`} /><span>{item.severity}</span><strong>{item.count}</strong></div>
            ))}
          </div>
        </article>
      </section>

      <section className="operations-grid">
        <article className="operations-panel">
          <div className="operations-panel-heading">
            <div><span className="eyebrow">Active trip snapshot</span><h3>Fleet status</h3></div>
            <Link className="text-link" to="/live-fleet">Open live fleet →</Link>
          </div>
          {liveItems.length === 0 ? <p className="empty-inline">There are no active trips in the current organization.</p> : (
            <div className="fleet-table-wrap">
              <table className="fleet-table">
                <thead><tr><th>Driver / vehicle</th><th>Connection</th><th>Risk</th><th>Speed</th><th>Last seen</th></tr></thead>
                <tbody>{liveItems.slice(0, 8).map((item) => (
                  <tr key={item.tripId} onClick={() => setSelectedTripId(item.tripId)}>
                    <td><strong>{item.driverName}</strong><span>{item.plateNumber} · {item.fleetName ?? 'No fleet'}</span></td>
                    <td><span className={`connection-pill connection-pill--${item.connectionStatus.toLowerCase()}`}>{item.connectionStatus}</span></td>
                    <td><span className={`risk-pill risk-pill--${(item.riskLevel ?? 'unknown').toLowerCase()}`}>{item.riskLevel ?? 'NO RISK'}</span></td>
                    <td>{formatNumeric(item.speedKph, ' km/h', 1)}</td>
                    <td>{formatTime(item.latestSeenAt)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </article>

        <article className="operations-panel">
          <div className="operations-panel-heading">
            <div><span className="eyebrow">Supervisor queue preview</span><h3>Active alerts</h3></div>
            <Link className="text-link" to="/alerts">W3 alert center →</Link>
          </div>
          <div className="alert-preview-list">
            {alerts.length === 0 ? <p className="empty-inline">No active alerts are currently returned by the backend.</p> : alerts.slice(0, 6).map((alert) => <AlertRow alert={alert} key={alert.id} />)}
          </div>
        </article>
      </section>

      <footer className="snapshot-footer">
        <span>REST generated: {formatTime(summary.generatedAt)}</span>
        <span>Last synchronized: {operations.lastSynchronizedAt ? operations.lastSynchronizedAt.toLocaleTimeString() : 'Not yet'}</span>
        <span>Last realtime event: {operations.lastRealtimeEvent ?? 'None since page load'}</span>
      </footer>
    </div>
  );
}
