import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import type { AnalyticsFilters, AnalyticsModelRow, LatencyMetric } from '../analytics/types';
import { useAnalytics } from '../analytics/useAnalytics';

function formatNumber(value: number | null | undefined, digits = 1): string {
  return value === null || value === undefined || !Number.isFinite(value) ? 'Unavailable' : value.toFixed(digits);
}

function formatDurationSeconds(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Unavailable';
  if (value < 60) return `${value.toFixed(1)} s`;
  return `${(value / 60).toFixed(1)} min`;
}

function formatPercent(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value) ? 'Unavailable' : `${(value * 100).toFixed(1)}%`;
}

function formatWindow(from: string, to: string): string {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Backend-selected window';
  const formatter = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function AnalyticsPage() {
  const analytics = useAnalytics();
  const [draft, setDraft] = useState<AnalyticsFilters>(analytics.filters);
  const bundle = analytics.bundle;

  const apply = (event: FormEvent) => {
    event.preventDefault();
    analytics.setFilters(draft);
  };

  const maxTrend = useMemo(() => {
    if (!bundle) return 1;
    return Math.max(1, ...bundle.trends.items.flatMap((item) => [item.safetyEvents, item.alerts]));
  }, [bundle]);

  if (analytics.loading && !bundle) {
    return <div className="operations-state"><div className="loading-ring" /><h2>Loading safety analytics</h2><p>Aggregating backend event, alert, feedback, model and latency data.</p></div>;
  }

  if (analytics.error && !bundle) {
    return (
      <div className="operations-state operations-state--error">
        <h2>Analytics unavailable</h2>
        <p>{analytics.error}</p>
        <button className="button button--solid" type="button" onClick={() => void analytics.refresh()}>Retry analytics</button>
      </div>
    );
  }

  const overview = bundle!.overview;

  return (
    <div className="content-stack analytics-page">
      <section className="operations-heading">
        <div>
          <div className="hero-kicker"><span className="status-pulse" />Phase W4 · Historical Analytics</div>
          <h2>Measured fleet-safety outcomes for the selected population and time window.</h2>
          <p>Counts, review outcomes, model context and latency are descriptive backend measurements. The dashboard does not infer causality or rank one model as scientifically superior.</p>
        </div>
        <div className="operations-actions">
          <button className="button button--solid" type="button" onClick={() => void analytics.refresh()} disabled={analytics.refreshing}>{analytics.refreshing ? 'Refreshing…' : 'Refresh'}</button>
          <Link className="button button--ghost" to="/safety-events">Inspect events</Link>
        </div>
      </section>

      <form className="analytics-range-form" onSubmit={apply}>
        <label><span>From</span><input type="date" value={draft.from} onChange={(e) => setDraft((current) => ({ ...current, from: e.target.value }))} /></label>
        <label><span>To</span><input type="date" value={draft.to} onChange={(e) => setDraft((current) => ({ ...current, to: e.target.value }))} /></label>
        <label><span>Trend bucket</span><select value={draft.bucket} onChange={(e) => setDraft((current) => ({ ...current, bucket: e.target.value as AnalyticsFilters['bucket'] }))}><option value="day">Day</option><option value="hour">Hour</option></select></label>
        <button className="button button--solid" type="submit">Apply range</button>
        <span>Backend maximum range: 366 days</span>
      </form>

      {analytics.error ? <div className="inline-warning"><strong>Analytics refresh issue:</strong> {analytics.error}</div> : null}

      <section className="analytics-window-banner">
        <span className="eyebrow">Population / time range</span>
        <strong>{formatWindow(overview.window.from, overview.window.to)}</strong>
        <span>Current authenticated organization only · backend-derived tenant scope</span>
      </section>

      <section className="operations-kpis analytics-kpis" aria-label="Analytics overview">
        <article><span>Total trips</span><strong>{overview.trips.totalTrips}</strong><small>{formatNumber(overview.trips.drivingHours, 1)} driving hours</small></article>
        <article><span>Safety events</span><strong>{overview.events.totalEvents}</strong><small>{overview.events.drowsinessEvents} drowsiness events</small></article>
        <article><span>Total alerts</span><strong>{overview.alerts.totalAlerts}</strong><small>{overview.alerts.criticalAlerts} critical · {overview.alerts.activeAlerts} active</small></article>
        <article><span>Reviewed events</span><strong>{overview.feedback.reviewedEvents}</strong><small>{formatPercent(overview.feedback.falseAlarmRate)} latest-review false-alarm rate</small></article>
        <article><span>Avg acknowledge</span><strong>{formatDurationSeconds(overview.alerts.avgAcknowledgeSeconds)}</strong><small>Created → acknowledged</small></article>
        <article><span>Avg resolve</span><strong>{formatDurationSeconds(overview.alerts.avgResolutionSeconds)}</strong><small>Created → resolved</small></article>
      </section>

      <section className="operations-grid analytics-primary-grid">
        <article className="operations-panel trend-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">Time series</span><h3>Safety events and alerts</h3></div><span className="muted-count">{bundle!.trends.bucket} buckets</span></div>
          {bundle!.trends.items.length === 0 ? <p className="empty-inline">No events or alerts are present in this range.</p> : (
            <div className="trend-chart" role="img" aria-label="Bar chart of safety-event and alert counts over time">
              {bundle!.trends.items.map((item) => (
                <div className="trend-column" key={item.bucket} title={`${item.bucket}: ${item.safetyEvents} events, ${item.alerts} alerts`}>
                  <div className="trend-bars"><span className="trend-bar trend-bar--events" style={{ height: `${Math.max(4, (item.safetyEvents / maxTrend) * 100)}%` }} /><span className="trend-bar trend-bar--alerts" style={{ height: `${Math.max(4, (item.alerts / maxTrend) * 100)}%` }} /></div>
                  <small>{new Date(item.bucket).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
                </div>
              ))}
            </div>
          )}
          <div className="chart-legend"><span><i className="legend-swatch legend-swatch--events" />Safety events</span><span><i className="legend-swatch legend-swatch--alerts" />Alerts</span></div>
        </article>

        <article className="operations-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">Risk observations</span><h3>Risk snapshot distribution</h3></div></div>
          <div className="analytics-distribution">
            {overview.riskDistribution.length === 0 ? <p className="empty-inline">No risk snapshots are present in this range.</p> : overview.riskDistribution.map((item) => {
              const total = overview.riskDistribution.reduce((sum, row) => sum + row.count, 0);
              const width = total > 0 ? (item.count / total) * 100 : 0;
              return <div key={item.riskLevel}><span className={`risk-pill risk-pill--${item.riskLevel.toLowerCase()}`}>{item.riskLevel}</span><div><span style={{ width: `${Math.max(5, width)}%` }} /></div><strong>{item.count}</strong></div>;
            })}
          </div>
          <div className="operations-panel-heading compact-heading"><div><span className="eyebrow">Human review</span><h3>Latest feedback classification</h3></div></div>
          <div className="feedback-summary-grid">
            <article><span>CONFIRMED</span><strong>{overview.feedback.confirmed}</strong></article>
            <article><span>FALSE_ALARM</span><strong>{overview.feedback.falseAlarm}</strong></article>
            <article><span>UNCERTAIN</span><strong>{overview.feedback.uncertain}</strong></article>
          </div>
        </article>
      </section>

      <section className="operations-panel">
        <div className="operations-panel-heading"><div><span className="eyebrow">Model / threshold context</span><h3>Observed event groups</h3></div><span className="muted-count">Descriptive comparison only</span></div>
        {bundle!.models.items.length === 0 ? <p className="empty-inline">No model-version groups are present in this range.</p> : (
          <div className="context-table-wrap"><table className="context-table analytics-model-table"><thead><tr><th>Model / profile</th><th>Events</th><th>Confirmed</th><th>False alarm</th><th>Uncertain</th><th>Avg inference</th><th>Avg ingestion</th></tr></thead><tbody>{bundle!.models.items.map((row) => <ModelRow row={row} key={`${row.modelVersion ?? 'none'}:${row.thresholdProfile ?? 'none'}`} />)}</tbody></table></div>
        )}
        <p className="analysis-note">Rows group stored safety events by model version and threshold profile. Counts and review classifications do not by themselves establish model accuracy, causal effect, or clinical validity.</p>
      </section>

      <section className="latency-grid">
        <LatencyCard title="Capture → backend receipt" metric={bundle!.latency.ingestion} />
        <LatencyCard title="Backend receipt → risk" metric={bundle!.latency.eventToRisk} />
        <LatencyCard title="Backend receipt → initial alert" metric={bundle!.latency.eventToInitialAlert} />
        <LatencyCard title="Dashboard delivery" metric={bundle!.latency.dashboardDelivery} />
      </section>

      <footer className="snapshot-footer"><span>Last synchronized: {analytics.lastSynchronizedAt ? analytics.lastSynchronizedAt.toLocaleTimeString() : 'Not yet'}</span><span>All analytics use backend-stored observations in the selected organization.</span></footer>
    </div>
  );
}

function ModelRow({ row }: { row: AnalyticsModelRow }) {
  return <tr><td><strong>{row.modelVersion ?? 'Model unavailable'}</strong><span className="table-subtext">{row.thresholdProfile ?? 'Threshold profile unavailable'}</span></td><td>{row.totalEvents}</td><td>{row.confirmed}</td><td>{row.falseAlarm}</td><td>{row.uncertain}</td><td>{row.avgInferenceLatencyMs === null ? 'Unavailable' : `${row.avgInferenceLatencyMs.toFixed(1)} ms`}</td><td>{row.avgIngestionDelayMs === null ? 'Unavailable' : `${row.avgIngestionDelayMs.toFixed(1)} ms`}</td></tr>;
}

function LatencyCard({ title, metric }: { title: string; metric: LatencyMetric }) {
  return <article className="operations-panel latency-card"><span className="eyebrow">Latency</span><h3>{title}</h3><div className="latency-values"><div><span>Samples</span><strong>{metric.samples}</strong></div><div><span>Average</span><strong>{metric.avgMs === null ? 'Unavailable' : `${metric.avgMs.toFixed(1)} ms`}</strong></div><div><span>p95</span><strong>{metric.p95Ms === null ? 'Unavailable' : `${metric.p95Ms.toFixed(1)} ms`}</strong></div></div>{metric.note ? <p className="analysis-note">{metric.note}</p> : null}</article>;
}
