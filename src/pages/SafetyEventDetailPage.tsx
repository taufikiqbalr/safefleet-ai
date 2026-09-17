import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { FeedbackClassification, SafetyReferenceData } from '../safety/types';
import { useSafetyEventDetail } from '../safety/useSafetyEventDetail';

function formatTime(value: string | null | undefined): string {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date);
}

function formatNumber(value: number | null | undefined, suffix = '', digits = 2): string {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'Unavailable'
    : `${value.toFixed(digits)}${suffix}`;
}

function shortId(value: string | null | undefined): string {
  if (!value) return 'Unavailable';
  return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

function contextLabels(references: SafetyReferenceData) {
  return {
    driver: new Map(references.drivers.map((item) => [item.id, `${item.fullName} (${item.employeeCode})`])),
    vehicle: new Map(references.vehicles.map((item) => [item.id, item.plateNumber])),
    device: new Map(references.devices.map((item) => [item.id, item.deviceUid])),
    user: new Map(references.users.map((item) => [item.id, item.fullName])),
  };
}

export function SafetyEventDetailPage() {
  const { eventId = '' } = useParams();
  const detail = useSafetyEventDetail(eventId);
  const [classification, setClassification] = useState<FeedbackClassification>('CONFIRMED');
  const [reason, setReason] = useState('');
  const labels = useMemo(
    () => detail.bundle ? contextLabels(detail.bundle.references) : null,
    [detail.bundle],
  );

  const submitFeedback = (event: FormEvent) => {
    event.preventDefault();
    void detail.submitFeedback(classification, reason).then(() => setReason(''));
  };

  if (detail.loading) {
    return <div className="operations-state"><div className="loading-ring" /><h2>Loading safety event</h2><p>Fetching measurements, review history, risk and nearby operational context.</p></div>;
  }

  if (detail.error && !detail.bundle) {
    return (
      <div className="operations-state operations-state--error">
        <h2>Safety event unavailable</h2>
        <p>{detail.error}</p>
        <Link className="button button--solid" to="/safety-events">Back to history</Link>
      </div>
    );
  }

  const bundle = detail.bundle!;
  const event = bundle.event;
  const drowsiness = bundle.drowsiness;
  const risk = bundle.riskSnapshot;

  return (
    <div className="content-stack safety-detail-page">
      <section className="operations-heading">
        <div>
          <Link className="text-link" to="/safety-events">← Safety event history</Link>
          <div className="hero-kicker detail-kicker"><span className="status-pulse" />Phase W4 · Event Review</div>
          <h2>{event.eventType} · {event.severity}</h2>
          <p>Captured {formatTime(event.capturedAt)}. Measurements remain immutable; human feedback is stored as a separate review history.</p>
        </div>
        <div className="operations-actions">
          <span className={`realtime-chip realtime-chip--${detail.realtimeStatus}`}>{detail.realtimeStatus}</span>
          <button className="button button--solid" type="button" onClick={() => void detail.refresh()} disabled={detail.refreshing}>
            {detail.refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      {detail.error ? <div className="inline-warning"><strong>Refresh issue:</strong> {detail.error}</div> : null}
      {detail.actionError ? <div className="inline-warning"><strong>Review action failed:</strong> {detail.actionError}</div> : null}

      <section className="operations-grid">
        <article className="operations-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">Event identity</span><h3>Operational context</h3></div><span className={`event-severity event-severity--${event.severity.toLowerCase()}`}>{event.severity}</span></div>
          <dl className="detail-list safety-detail-list">
            <div><dt>Event UUID</dt><dd>{event.id}</dd></div>
            <div><dt>Driver</dt><dd>{event.driverId ? labels?.driver.get(event.driverId) ?? shortId(event.driverId) : 'Unavailable'}</dd></div>
            <div><dt>Vehicle</dt><dd>{event.vehicleId ? labels?.vehicle.get(event.vehicleId) ?? shortId(event.vehicleId) : 'Unavailable'}</dd></div>
            <div><dt>Device</dt><dd>{labels?.device.get(event.deviceId) ?? shortId(event.deviceId)}</dd></div>
            <div><dt>Trip</dt><dd>{event.tripId ?? 'Unavailable'}</dd></div>
            <div><dt>Source alert level</dt><dd>{event.sourceAlertLevel ?? 'Unavailable'}</dd></div>
            <div><dt>Local alarm</dt><dd>{event.localAlarmTriggered === null ? 'Unavailable' : event.localAlarmTriggered ? 'Triggered' : 'Not triggered'}</dd></div>
            <div><dt>GPS</dt><dd>{event.latitude === null || event.longitude === null ? 'Unavailable' : `${event.latitude.toFixed(6)}, ${event.longitude.toFixed(6)}`}</dd></div>
          </dl>
        </article>

        <article className="operations-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">Inference context</span><h3>Model and capture metadata</h3></div></div>
          <dl className="detail-list safety-detail-list">
            <div><dt>Drowsiness score</dt><dd>{formatNumber(event.drowsinessScore, '', 3)}</dd></div>
            <div><dt>Model version</dt><dd>{event.modelVersion ?? 'Unavailable'}</dd></div>
            <div><dt>Threshold profile</dt><dd>{event.thresholdProfile ?? 'Unavailable'}</dd></div>
            <div><dt>Inference latency</dt><dd>{event.inferenceLatencyMs === null ? 'Unavailable' : `${event.inferenceLatencyMs} ms`}</dd></div>
            <div><dt>App version</dt><dd>{event.appVersion ?? 'Unavailable'}</dd></div>
            <div><dt>Received</dt><dd>{formatTime(event.receivedAt)}</dd></div>
            <div><dt>Client event</dt><dd>{event.clientEventId}</dd></div>
            <div><dt>Sequence</dt><dd>{event.sequenceNumber ?? 'Unavailable'}</dd></div>
          </dl>
        </article>
      </section>

      {event.eventType === 'DROWSINESS' ? (
        <section className="operations-panel">
          <div className="operations-panel-heading">
            <div><span className="eyebrow">Derived computer-vision measurements</span><h3>Drowsiness evidence</h3></div>
            <span className="muted-count">No universal threshold interpretation</span>
          </div>
          {drowsiness ? (
            <div className="measurement-grid">
              <Measurement label="EAR" value={formatNumber(drowsiness.eyeAspectRatio, '', 4)} />
              <Measurement label="MAR" value={formatNumber(drowsiness.mouthAspectRatio, '', 4)} />
              <Measurement label="PERCLOS" value={formatNumber(drowsiness.perclosPercent, '%', 2)} />
              <Measurement label="Blink rate" value={formatNumber(drowsiness.blinkRatePerMinute, '/min', 1)} />
              <Measurement label="Eye closure" value={drowsiness.eyeClosureDurationMs === null ? 'Unavailable' : `${drowsiness.eyeClosureDurationMs} ms`} />
              <Measurement label="Yawning" value={drowsiness.yawning === null ? 'Unavailable' : drowsiness.yawning ? 'Yes' : 'No'} />
              <Measurement label="Yawn duration" value={drowsiness.yawnDurationMs === null ? 'Unavailable' : `${drowsiness.yawnDurationMs} ms`} />
              <Measurement label="Head pitch" value={formatNumber(drowsiness.headPitchDeg, '°', 1)} />
              <Measurement label="Head yaw" value={formatNumber(drowsiness.headYawDeg, '°', 1)} />
              <Measurement label="Head roll" value={formatNumber(drowsiness.headRollDeg, '°', 1)} />
              <Measurement label="Face detected" value={drowsiness.faceDetected === null ? 'Unavailable' : drowsiness.faceDetected ? 'Yes' : 'No'} />
            </div>
          ) : <p className="empty-inline">The backend returned no drowsiness detail record for this event.</p>}
          <p className="analysis-note">EAR, MAR, PERCLOS and temporal measurements are displayed exactly as captured context. SafeFleet Web does not convert them into universal scientific or medical cutoffs.</p>
        </section>
      ) : null}

      <section className="operations-grid">
        <article className="operations-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">Backend risk intelligence</span><h3>Risk snapshot</h3></div></div>
          {risk ? (
            <>
              <div className="risk-detail-header"><span className={`risk-pill risk-pill--${risk.riskLevel.toLowerCase()}`}>{risk.riskLevel}</span><strong>{risk.score === null ? 'No score' : `Score ${risk.score}`}</strong></div>
              <dl className="detail-list safety-detail-list">
                <div><dt>Policy version</dt><dd>{risk.policyVersion}</dd></div>
                <div><dt>Calculated</dt><dd>{formatTime(risk.calculatedAt)}</dd></div>
                <div><dt>Snapshot UUID</dt><dd>{risk.id}</dd></div>
              </dl>
              <span className="eyebrow json-heading">Contributing factors</span>
              <pre className="json-panel">{JSON.stringify(risk.contributingFactors, null, 2)}</pre>
            </>
          ) : <p className="empty-inline">No matching risk snapshot was returned for this safety event. Another snapshot is not substituted.</p>}
        </article>

        <article className="operations-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">Immutable event payload</span><h3>Additional metadata</h3></div></div>
          {Object.keys(event.metadata).length > 0 ? <pre className="json-panel">{JSON.stringify(event.metadata, null, 2)}</pre> : <p className="empty-inline">No additional metadata was stored.</p>}
        </article>
      </section>

      <section className="operations-panel">
        <div className="operations-panel-heading"><div><span className="eyebrow">Human review</span><h3>Feedback history</h3></div><span className="muted-count">{bundle.feedback.length} entries</span></div>
        {detail.canReview ? (
          <form className="review-form" onSubmit={submitFeedback}>
            <label><span>Classification</span><select value={classification} onChange={(e) => setClassification(e.target.value as FeedbackClassification)}><option value="CONFIRMED">CONFIRMED</option><option value="FALSE_ALARM">FALSE_ALARM</option><option value="UNCERTAIN">UNCERTAIN</option></select></label>
            <label className="review-reason"><span>Reason / note</span><textarea maxLength={2000} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional review rationale; event measurements are not modified." /></label>
            <button className="button button--solid" type="submit" disabled={detail.actionInProgress}>{detail.actionInProgress ? 'Saving review…' : 'Add review feedback'}</button>
          </form>
        ) : <p className="analysis-note">Your current role has read-only access to safety feedback.</p>}
        <div className="feedback-timeline">
          {bundle.feedback.length === 0 ? <p className="empty-inline">This event has not been reviewed yet.</p> : bundle.feedback.map((item) => (
            <article key={item.id}>
              <span className={`review-chip review-chip--${item.classification.toLowerCase()}`}>{item.classification}</span>
              <div><strong>{labels?.user.get(item.reviewerUserId) ?? shortId(item.reviewerUserId)}</strong><span>{item.reason ?? 'No review reason supplied.'}</span></div>
              <time>{formatTime(item.createdAt)}</time>
            </article>
          ))}
        </div>
      </section>

      <section className="operations-grid">
        <article className="operations-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">±5 minute context</span><h3>Telemetry around capture</h3></div><span className="muted-count">{bundle.telemetry.length} points</span></div>
          {bundle.telemetry.length === 0 ? <p className="empty-inline">No telemetry points were returned for the event context window.</p> : (
            <div className="context-table-wrap"><table className="context-table"><thead><tr><th>Captured</th><th>Speed</th><th>Battery</th><th>Network</th><th>GPS</th></tr></thead><tbody>{bundle.telemetry.slice(0, 20).map((item) => <tr key={item.id}><td>{formatTime(item.capturedAt)}</td><td>{formatNumber(item.speedKph, ' km/h', 1)}</td><td>{item.batteryPercent === null ? 'Unavailable' : `${item.batteryPercent}%`}</td><td>{item.networkType ?? 'Unavailable'}</td><td>{item.latitude === null || item.longitude === null ? 'Unavailable' : `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`}</td></tr>)}</tbody></table></div>
          )}
        </article>

        <article className="operations-panel">
          <div className="operations-panel-heading"><div><span className="eyebrow">±5 minute context</span><h3>Cabin / sensor readings</h3></div><span className="muted-count">{bundle.sensorReadings.length} readings</span></div>
          {bundle.sensorReadings.length === 0 ? <p className="empty-inline">No sensor readings were returned for the event context window.</p> : (
            <div className="context-table-wrap"><table className="context-table"><thead><tr><th>Captured</th><th>Sensor</th><th>Value</th><th>Status</th></tr></thead><tbody>{bundle.sensorReadings.slice(0, 20).map((item) => <tr key={item.id}><td>{formatTime(item.capturedAt)}</td><td>{item.sensorType}<span className="table-subtext">{item.sensorId}</span></td><td>{item.value} {item.unit}</td><td>{item.sensorStatus ?? 'Unavailable'}</td></tr>)}</tbody></table></div>
          )}
          <p className="analysis-note">Sensor readings are displayed as recorded values. The web client does not invent hardware-specific toxic-gas thresholds.</p>
        </article>
      </section>
    </div>
  );
}

function Measurement({ label, value }: { label: string; value: string }) {
  return <article className="measurement-card"><span>{label}</span><strong>{value}</strong></article>;
}
