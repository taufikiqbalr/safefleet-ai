import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { canActOnAlert } from '../alerts/permissions';
import { useAlertDetail } from '../alerts/useAlertDetail';

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
  return `${value.slice(0, 8)}…`;
}

export function AlertDetailPage() {
  const { alertId = '' } = useParams();
  const auth = useAuth();
  const detail = useAlertDetail(alertId);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [note, setNote] = useState('');

  const userById = useMemo(
    () => new Map((detail.bundle?.references.users ?? []).map((item) => [item.id, item])),
    [detail.bundle?.references.users],
  );

  if (!alertId) return <div className="operations-state operations-state--error"><h2>Invalid alert route</h2><Link className="text-link" to="/alerts">Return to alert center</Link></div>;
  if (detail.loading) return <div className="operations-state"><div className="loading-ring" /><h2>Loading alert detail</h2><p>Fetching the alert record, lifecycle history and related safety context.</p></div>;
  if (detail.error && !detail.bundle) return <div className="operations-state operations-state--error"><h2>Alert detail unavailable</h2><p>{detail.error}</p><button className="button button--solid" type="button" onClick={() => void detail.refresh()}>Retry</button></div>;

  const bundle = detail.bundle!;
  const alert = bundle.alert;
  const driver = bundle.references.drivers.find((item) => item.id === alert.driverId);
  const vehicle = bundle.references.vehicles.find((item) => item.id === alert.vehicleId);
  const currentAssignee = alert.assignedToUserId ? userById.get(alert.assignedToUserId) : undefined;
  const actions = canActOnAlert(auth.session!.user.role, alert);
  const activeUsers = bundle.references.users.filter((user) => user.status === 'ACTIVE');

  const confirmAndMutate = async (kind: 'assign' | 'unassign' | 'acknowledge' | 'escalate' | 'resolve', userId?: string | null) => {
    const label = kind === 'assign' ? 'assign this alert' : kind === 'unassign' ? 'remove the current assignment' : `${kind} this alert`;
    if (!window.confirm(`Confirm: ${label}?`)) return;
    const success = await detail.mutate(kind, { userId, note });
    if (success) setNote('');
  };

  return (
    <div className="content-stack alert-detail">
      <div className="alert-detail-breadcrumb"><Link className="text-link" to="/alerts">← Alert Center</Link><span>{shortId(alert.id)}</span></div>

      <section className="operations-heading alert-detail-heading">
        <div>
          <div className="hero-kicker"><span className="status-pulse" />W3 · Alert Detail</div>
          <h2>{alert.title}</h2>
          <p>{alert.message ?? 'No backend message was provided for this alert.'}</p>
        </div>
        <div className="context-badges"><span className={`risk-pill risk-pill--${alert.severity.toLowerCase()}`}>{alert.severity}</span><span className={`alert-status alert-status--${alert.status.toLowerCase()}`}>{alert.status}</span><span className={`realtime-chip realtime-chip--${detail.realtimeStatus}`}>{detail.realtimeStatus}</span></div>
      </section>

      {detail.error ? <div className="inline-warning"><strong>Operation issue:</strong> {detail.error}</div> : null}
      {detail.actionMessage ? <div className="inline-success">{detail.actionMessage}</div> : null}

      <section className="two-column-grid">
        <article className="operations-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">Operational context</span><h3>Alert record</h3></div></div>
          <dl className="detail-list alert-detail-list">
            <div><dt>Alert type</dt><dd>{alert.alertType}</dd></div>
            <div><dt>Driver</dt><dd>{driver ? `${driver.fullName} · ${driver.employeeCode}` : shortId(alert.driverId)}</dd></div>
            <div><dt>Vehicle</dt><dd>{vehicle?.plateNumber ?? shortId(alert.vehicleId)}</dd></div>
            <div><dt>Trip</dt><dd>{shortId(alert.tripId)}</dd></div>
            <div><dt>Occurrences</dt><dd>{alert.occurrenceCount}</dd></div>
            <div><dt>First event</dt><dd>{formatTime(alert.firstEventAt)}</dd></div>
            <div><dt>Last event</dt><dd>{formatTime(alert.lastEventAt)}</dd></div>
            <div><dt>Assignee</dt><dd>{currentAssignee?.fullName ?? shortId(alert.assignedToUserId)}</dd></div>
            <div><dt>Acknowledged</dt><dd>{formatTime(alert.acknowledgedAt)}</dd></div>
            <div><dt>Resolved</dt><dd>{formatTime(alert.resolvedAt)}</dd></div>
          </dl>
          {alert.resolutionNotes ? <p className="panel-note"><strong>Resolution note:</strong> {alert.resolutionNotes}</p> : null}
        </article>

        <article className="operations-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">Supervisor controls</span><h3>Alert actions</h3></div></div>
          {actions.assign || actions.acknowledge || actions.escalate || actions.resolve ? (
            <div className="alert-actions-panel">
              <label>Assignee<select value={selectedAssignee} onChange={(event) => setSelectedAssignee(event.target.value)} disabled={!actions.assign || detail.actionPending !== null}>
                <option value="">Select active operator</option>{activeUsers.map((user) => <option key={user.id} value={user.id}>{user.fullName} · {user.role}</option>)}
              </select></label>
              <label>Action note<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={4} placeholder="Optional operational note" /></label>
              <div className="alert-action-buttons">
                <button className="button button--solid" type="button" disabled={!actions.assign || !selectedAssignee || detail.actionPending !== null} onClick={() => void confirmAndMutate('assign', selectedAssignee)}>Assign</button>
                <button className="button button--ghost" type="button" disabled={!actions.assign || !alert.assignedToUserId || detail.actionPending !== null} onClick={() => void confirmAndMutate('unassign', null)}>Unassign</button>
                <button className="button button--ghost" type="button" disabled={!actions.acknowledge || detail.actionPending !== null} onClick={() => void confirmAndMutate('acknowledge')}>Acknowledge</button>
                <button className="button button--ghost" type="button" disabled={!actions.escalate || detail.actionPending !== null} onClick={() => void confirmAndMutate('escalate')}>Escalate</button>
                <button className="button button--danger" type="button" disabled={!actions.resolve || detail.actionPending !== null} onClick={() => void confirmAndMutate('resolve')}>Resolve</button>
              </div>
              {detail.actionPending ? <span className="action-progress">Applying {detail.actionPending}…</span> : null}
            </div>
          ) : <p className="empty-inline">Your role is read-only for alert mutations, or this alert is already resolved.</p>}
        </article>
      </section>

      <section className="operations-grid">
        <article className="operations-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">Originating observation</span><h3>Safety event</h3></div></div>
          {bundle.safetyEvent ? <dl className="detail-list alert-detail-list">
            <div><dt>Event type</dt><dd>{bundle.safetyEvent.eventType}</dd></div>
            <div><dt>Source severity</dt><dd>{bundle.safetyEvent.severity}</dd></div>
            <div><dt>Captured</dt><dd>{formatTime(bundle.safetyEvent.capturedAt)}</dd></div>
            <div><dt>Drowsiness score</dt><dd>{bundle.safetyEvent.drowsinessScore ?? 'Unavailable'}</dd></div>
            <div><dt>Local alarm</dt><dd>{bundle.safetyEvent.localAlarmTriggered === null ? 'Unavailable' : bundle.safetyEvent.localAlarmTriggered ? 'Triggered' : 'Not triggered'}</dd></div>
            <div><dt>Threshold profile</dt><dd>{bundle.safetyEvent.thresholdProfile ?? 'Unavailable'}</dd></div>
            <div><dt>Model</dt><dd>{bundle.safetyEvent.modelVersion ?? 'Unavailable'}</dd></div>
            <div><dt>Inference latency</dt><dd>{bundle.safetyEvent.inferenceLatencyMs === null ? 'Unavailable' : `${bundle.safetyEvent.inferenceLatencyMs} ms`}</dd></div>
          </dl> : <p className="empty-inline">The alert does not expose a retrievable safety-event context.</p>}
          <p className="panel-note">These values are backend-provided driver-safety observations. The web console does not reinterpret them as a medical diagnosis.</p>
        </article>

        <article className="operations-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">Policy output</span><h3>Risk snapshot</h3></div></div>
          {bundle.riskSnapshot ? <>
            <dl className="detail-list alert-detail-list">
              <div><dt>Risk level</dt><dd>{bundle.riskSnapshot.riskLevel}</dd></div>
              <div><dt>Score</dt><dd>{bundle.riskSnapshot.score ?? 'Unavailable'}</dd></div>
              <div><dt>Policy version</dt><dd>{bundle.riskSnapshot.policyVersion}</dd></div>
              <div><dt>Calculated</dt><dd>{formatTime(bundle.riskSnapshot.calculatedAt)}</dd></div>
            </dl>
            <div className="factor-block"><span className="eyebrow">Contributing factors</span><pre>{JSON.stringify(bundle.riskSnapshot.contributingFactors, null, 2)}</pre></div>
          </> : <p className="empty-inline">No matching risk snapshot was resolved from the current backend query contract. Reference: {shortId(alert.riskSnapshotId)}</p>}
        </article>
      </section>

      <section className="operations-panel">
        <div className="operations-panel-heading"><div><span className="eyebrow">Audit timeline</span><h3>Lifecycle history</h3></div><span className="muted-count">{bundle.history.length} entries</span></div>
        {bundle.history.length === 0 ? <p className="empty-inline">No alert status history was returned.</p> : <div className="alert-timeline">{bundle.history.map((entry) => {
          const actor = entry.actorUserId ? userById.get(entry.actorUserId) : undefined;
          return <article key={entry.id}><span className="timeline-dot" /><div><strong>{entry.fromStatus ?? 'CREATED'} → {entry.toStatus}</strong><span>{formatTime(entry.createdAt)} · {actor?.fullName ?? (entry.actorUserId ? shortId(entry.actorUserId) : 'System')}</span>{entry.note ? <p>{entry.note}</p> : null}</div></article>;
        })}</div>}
      </section>
    </div>
  );
}
