import { useCallback, useEffect, useState } from 'react';

import { checkBackendHealth, type BackendHealth } from '../lib/api';
import { appConfig } from '../lib/config';

const initialHealth: BackendHealth = {
  status: 'checking',
  detail: 'Checking backend liveness…',
  checkedAt: null,
};

const roadmap = [
  ['W0', 'Foundation', 'Application shell, navigation, environment configuration, diagnostics, CI.', 'complete'],
  ['W1', 'Auth & tenant session', 'Organization login, JWT bootstrap, protected routes, RBAC-aware navigation.', 'next'],
  ['W2', 'Live fleet dashboard', 'Fleet summary, live vehicle state, GPS map, active trips, operational status.', 'planned'],
  ['W3', 'Realtime alert center', 'Socket.IO updates, alert queue, assignment, acknowledgement and resolution.', 'planned'],
  ['W4', 'History & analytics', 'Safety history, drowsiness detail, feedback, trends, models and latency.', 'planned'],
  ['W5', 'Administration', 'Drivers, vehicles, devices, assignments, provisioning and risk policy.', 'planned'],
  ['W6', 'Release hardening', 'Accessibility, integration tests, performance, deployment and release checks.', 'planned'],
] as const;

export function FoundationPage() {
  const [health, setHealth] = useState<BackendHealth>(initialHealth);

  const refreshHealth = useCallback(async (signal?: AbortSignal) => {
    setHealth({ status: 'checking', detail: 'Checking backend liveness…', checkedAt: null });
    const result = await checkBackendHealth(signal);
    setHealth(result);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refreshHealth(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [refreshHealth]);

  const checkedAt = health.checkedAt
    ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(health.checkedAt)
    : 'Not checked yet';

  return (
    <div className="content-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="status-pulse" />
            Phase W0 · Web Foundation
          </div>
          <h2>Fleet safety operations, built around the backend contract.</h2>
          <p>
            The foundation intentionally shows no invented fleet telemetry. Live drivers, risk, alerts,
            maps and analytics are connected phase-by-phase to SafeFleet Backend.
          </p>
          <div className="hero-actions">
            <button type="button" className="button button--primary" onClick={() => void refreshHealth()}>
              Recheck backend
            </button>
            <a className="button button--secondary" href="https://github.com/taufikiqbalr/safefleet-ai_backend" target="_blank" rel="noreferrer">
              Backend repository
            </a>
          </div>
        </div>
        <div className="hero-signal" aria-hidden="true">
          <div className="signal-orbit signal-orbit--outer" />
          <div className="signal-orbit signal-orbit--middle" />
          <div className="signal-core">SF</div>
          <span className="signal-node signal-node--one">Mobile</span>
          <span className="signal-node signal-node--two">Backend</span>
          <span className="signal-node signal-node--three">Web</span>
        </div>
      </section>

      <section className="metric-grid" aria-label="Foundation status">
        <StatusMetric
          label="Backend API"
          value={health.status === 'reachable' ? 'Reachable' : health.status === 'unreachable' ? 'Unavailable' : 'Checking'}
          detail={health.detail}
          tone={health.status}
        />
        <StatusMetric label="Web shell" value="Ready" detail="React, TypeScript, Vite, responsive layout" tone="reachable" />
        <StatusMetric label="Authentication" value="W1" detail="JWT session and role-aware routes are next" tone="neutral" />
        <StatusMetric label="Realtime" value="W3" detail="Socket.IO integration stays isolated from foundation" tone="neutral" />
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Environment</span>
              <h3>Backend connection</h3>
            </div>
            <span className={`connection-chip connection-chip--${health.status}`}>{health.status}</span>
          </div>
          <dl className="detail-list">
            <div><dt>API base URL</dt><dd>{appConfig.apiBaseUrl}</dd></div>
            <div><dt>Web version</dt><dd>{appConfig.webVersion}</dd></div>
            <div><dt>Development port</dt><dd>3001</dd></div>
            <div><dt>Last health check</dt><dd>{checkedAt}</dd></div>
          </dl>
          <p className="panel-note">
            Port 3001 matches the backend development CORS default. Production URLs are supplied through environment configuration.
          </p>
        </article>

        <article className="panel architecture-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">System boundary</span>
              <h3>Operational responsibility</h3>
            </div>
          </div>
          <div className="architecture-flow">
            <div><strong>Mobile</strong><span>Perception + local driver alarm</span></div>
            <span className="flow-arrow">→</span>
            <div><strong>Backend</strong><span>Risk + alerts + persistence</span></div>
            <span className="flow-arrow">→</span>
            <div><strong>Web</strong><span>Supervisor operations</span></div>
          </div>
          <p className="panel-note">
            The web console supervises fleet state; it is never the primary wake-up mechanism for a drowsy driver.
          </p>
        </article>
      </section>

      <section className="panel roadmap-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Delivery plan</span>
            <h3>Web phases</h3>
          </div>
          <span className="roadmap-progress">1 / 7 phases</span>
        </div>
        <div className="roadmap-list">
          {roadmap.map(([phase, title, description, status]) => (
            <article key={phase} className={`roadmap-item roadmap-item--${status}`}>
              <div className="roadmap-index">{phase}</div>
              <div>
                <div className="roadmap-title-row">
                  <h4>{title}</h4>
                  <span>{status === 'complete' ? 'Complete' : status === 'next' ? 'Next' : 'Planned'}</span>
                </div>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

type StatusMetricProps = {
  label: string;
  value: string;
  detail: string;
  tone: 'checking' | 'reachable' | 'unreachable' | 'neutral';
};

function StatusMetric({ label, value, detail, tone }: StatusMetricProps) {
  return (
    <article className="metric-card">
      <div className="metric-card-topline">
        <span>{label}</span>
        <span className={`metric-dot metric-dot--${tone}`} />
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
