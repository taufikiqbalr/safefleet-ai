import { useMemo, useState } from 'react';

import { FleetMap } from '../components/FleetMap';
import { DEFAULT_LIVE_FLEET_FILTERS, filterLiveFleetItems, hasCoordinates, toFiniteNumber, type LiveFleetFilters } from '../dashboard/filters';
import type { LiveFleetItem } from '../dashboard/types';
import { useFleetOperations } from '../dashboard/useFleetOperations';

function displayNumber(value: number | string | null, suffix = '', digits = 0): string {
  const number = toFiniteNumber(value);
  return number === null ? 'Unavailable' : `${number.toFixed(digits)}${suffix}`;
}

function displayTime(value: string | null): string {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString();
}

function SelectedTripPanel({ item }: { item: LiveFleetItem }) {
  return (
    <article className="operations-panel selected-trip-panel">
      <div className="operations-panel-heading">
        <div><span className="eyebrow">Selected active trip</span><h3>{item.plateNumber}</h3></div>
        <div className="context-badges"><span className={`risk-pill risk-pill--${(item.riskLevel ?? 'unknown').toLowerCase()}`}>{item.riskLevel ?? 'NO RISK'}</span><span className={`connection-pill connection-pill--${item.connectionStatus.toLowerCase()}`}>{item.connectionStatus}</span></div>
      </div>
      <dl className="trip-detail-grid">
        <div><dt>Driver</dt><dd>{item.driverName} ({item.driverCode})</dd></div>
        <div><dt>Fleet</dt><dd>{item.fleetName ?? 'Unavailable'}</dd></div>
        <div><dt>Trip started</dt><dd>{displayTime(item.tripStartedAt)}</dd></div>
        <div><dt>Latest GPS</dt><dd>{hasCoordinates(item) ? `${displayNumber(item.latitude, '', 5)}, ${displayNumber(item.longitude, '', 5)}` : 'Unavailable'}</dd></div>
        <div><dt>Speed</dt><dd>{displayNumber(item.speedKph, ' km/h', 1)}</dd></div>
        <div><dt>Battery</dt><dd>{item.batteryPercent === null ? 'Unavailable' : `${item.batteryPercent}%`}</dd></div>
        <div><dt>Network</dt><dd>{item.networkType ?? 'Unavailable'}</dd></div>
        <div><dt>Last seen</dt><dd>{displayTime(item.latestSeenAt)}</dd></div>
        <div><dt>Risk score</dt><dd>{displayNumber(item.riskScore, '', 1)}</dd></div>
        <div><dt>Active alert</dt><dd>{item.alertId ? `${item.alertSeverity ?? 'UNKNOWN'} · ${item.alertStatus ?? 'UNKNOWN'}` : 'None'}</dd></div>
      </dl>
    </article>
  );
}

export function LiveFleetPage() {
  const operations = useFleetOperations();
  const [filters, setFilters] = useState<LiveFleetFilters>(DEFAULT_LIVE_FLEET_FILTERS);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const items = operations.liveFleet?.items ?? [];
  const filteredItems = useMemo(() => filterLiveFleetItems(items, filters), [filters, items]);
  const selected = items.find((item) => item.tripId === selectedTripId) ?? null;
  const fleets = useMemo(() => {
    const byId = new Map<string, string>();
    for (const item of items) if (item.fleetId && item.fleetName) byId.set(item.fleetId, item.fleetName);
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  if (operations.loading) return <div className="operations-state"><div className="loading-ring" /><h2>Loading live fleet</h2><p>Reading active trips and latest backend telemetry.</p></div>;
  if (operations.error && !operations.liveFleet) return <div className="operations-state operations-state--error"><h2>Live fleet unavailable</h2><p>{operations.error}</p><button type="button" className="button button--solid" onClick={() => void operations.refresh()}>Retry</button></div>;

  return (
    <div className="content-stack operations-dashboard">
      <section className="operations-heading">
        <div><div className="hero-kicker"><span className="status-pulse" />W2 · Active trip operations</div><h2>Live fleet</h2><p>Filters below apply to the currently loaded organization snapshot. No missing location is interpolated.</p></div>
        <div className="operations-actions"><span className={`realtime-chip realtime-chip--${operations.realtimeStatus}`}>{operations.realtimeStatus}</span><button type="button" className="button button--solid" onClick={() => void operations.refresh()} disabled={operations.refreshing}>{operations.refreshing ? 'Refreshing…' : 'Refresh'}</button></div>
      </section>

      <section className="fleet-filter-bar">
        <label><span>Search loaded snapshot</span><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Driver, plate, fleet…" /></label>
        <label><span>Risk</span><select value={filters.risk} onChange={(event) => setFilters((current) => ({ ...current, risk: event.target.value as LiveFleetFilters['risk'] }))}><option value="ALL">All</option><option value="CRITICAL">Critical</option><option value="WARNING">Warning</option><option value="CAUTION">Caution</option><option value="NORMAL">Normal</option><option value="UNKNOWN">No risk snapshot</option></select></label>
        <label><span>Connection</span><select value={filters.connection} onChange={(event) => setFilters((current) => ({ ...current, connection: event.target.value as LiveFleetFilters['connection'] }))}><option value="ALL">All</option><option value="ONLINE">Online</option><option value="STALE">Stale</option><option value="OFFLINE">Offline</option></select></label>
        <label><span>Alert</span><select value={filters.alert} onChange={(event) => setFilters((current) => ({ ...current, alert: event.target.value as LiveFleetFilters['alert'] }))}><option value="ALL">All</option><option value="ACTIVE">Active alert</option><option value="NONE">No active alert</option></select></label>
        <label><span>Fleet</span><select value={filters.fleetId} onChange={(event) => setFilters((current) => ({ ...current, fleetId: event.target.value }))}><option value="ALL">All fleets</option>{fleets.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <button type="button" className="button button--ghost" onClick={() => setFilters(DEFAULT_LIVE_FLEET_FILTERS)}>Reset</button>
      </section>

      <div className="filter-result-note">Showing {filteredItems.length} of {items.length} active trips · stale threshold {operations.liveFleet?.staleAfterSeconds ?? 120}s</div>

      <section className="operations-panel operations-map-panel">
        <div className="operations-panel-heading"><div><span className="eyebrow">Backend GPS</span><h3>Filtered fleet map</h3></div><span className="muted-count">{filteredItems.filter(hasCoordinates).length} mapped</span></div>
        <FleetMap items={filteredItems} selectedTripId={selectedTripId} onSelect={setSelectedTripId} />
      </section>

      {selected ? <SelectedTripPanel item={selected} /> : null}

      <section className="operations-panel">
        <div className="operations-panel-heading"><div><span className="eyebrow">Active trips</span><h3>Operational detail</h3></div><span className="muted-count">Snapshot {operations.liveFleet ? displayTime(operations.liveFleet.generatedAt) : 'Unavailable'}</span></div>
        {filteredItems.length === 0 ? <p className="empty-inline">No active trip matches the current snapshot filters.</p> : (
          <div className="fleet-table-wrap"><table className="fleet-table fleet-table--detailed"><thead><tr><th>Driver / vehicle</th><th>Fleet</th><th>Connection</th><th>Risk / alert</th><th>Telemetry</th><th>GPS</th></tr></thead><tbody>{filteredItems.map((item) => (
            <tr key={item.tripId} className={selectedTripId === item.tripId ? 'is-selected' : ''} onClick={() => setSelectedTripId(item.tripId)}>
              <td><strong>{item.driverName}</strong><span>{item.driverCode} · {item.plateNumber}</span></td>
              <td>{item.fleetName ?? 'Unavailable'}</td>
              <td><span className={`connection-pill connection-pill--${item.connectionStatus.toLowerCase()}`}>{item.connectionStatus}</span><span>{displayTime(item.latestSeenAt)}</span></td>
              <td><span className={`risk-pill risk-pill--${(item.riskLevel ?? 'unknown').toLowerCase()}`}>{item.riskLevel ?? 'NO RISK'}</span><span>{item.alertId ? `${item.alertSeverity ?? 'Alert'} · ${item.alertStatus ?? 'Active'}` : 'No active alert'}</span></td>
              <td><strong>{displayNumber(item.speedKph, ' km/h', 1)}</strong><span>{item.batteryPercent === null ? 'Battery unavailable' : `${item.batteryPercent}% battery`} · {item.networkType ?? 'network unavailable'}</span></td>
              <td>{hasCoordinates(item) ? <><strong>{displayNumber(item.latitude, '', 5)}</strong><span>{displayNumber(item.longitude, '', 5)}</span></> : <span>No GPS</span>}</td>
            </tr>
          ))}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
