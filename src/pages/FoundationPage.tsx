import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { checkBackendHealth, type BackendHealth } from '../lib/api';
import { appConfig } from '../lib/config';

const initialHealth: BackendHealth = {
  status: 'checking',
  detail: 'Checking backend liveness…',
  checkedAt: null,
};

const roadmap = [
  ['W0', 'Foundation', 'Application shell, navigation, environment configuration, diagnostics, CI.', 'complete'],
  ['W1', 'Auth & tenant session', 'Organization login, JWT bootstrap, protected routes, RBAC-aware navigation.', 'complete'],
  ['W2', 'Live fleet dashboard', 'Fleet summary, live vehicle state, GPS map, active trips, operational status.', 'next'],
  ['W3', 'Realtime alert center', 'Socket.IO updates, alert queue, assignment, acknowledgement and resolution.', 'planned'],
  ['W4', 'History & analytics', 'Safety history, drowsiness detail, feedback, trends, models and latency.', 'planned'],
  ['W5', 'Administration', 'Drivers, vehicles, devices, assignments, provisioning and risk policy.', 'planned'],
  ['W6', 'Release hardening', 'Accessibility, integration tests, performance, deployment and release checks.', 'planned'],
] as const;

export function FoundationPage() {
  const auth = useAuth();
  const session = auth.session!;
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
  const expiresAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(session.expiresAt));

  return (
    <div className="content-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="status-pulse" />
            Phase W1 · Authenticated Operations
          </div>
          <h2>{session.organization.name} is connected to the SafeFleet operator console.</h2>
          <p>
            Your browser session has been verified against SafeFleet Backend. Tenant identity and role come from the authenticated backend context; later phases now have a secure boundary for live fleet data.
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

      <section className="metric-grid" aria-label="Web status">
        <StatusMetric
          label="Backend API"
          value={health.status === 'reachable' ? 'Reachable' : health.status === 'unreachable' ? 'Unavailable' : 'Checking'}
          detail={health.detail}
          tone={health.status}
        />
        <StatusMetric label="Authentication" value="Verified" detail="JWT user and organization bootstrap complete" tone="reachable" />
        <StatusMetric label="Operator role" value={session.user.role} detail="Navigation and actions are role-aware" tone="neutral" />
        <StatusMetric label="Next delivery" value="W2" detail="Live fleet dashboard and operational state" tone="neutral" />
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Authenticated tenant</span>
              <h3>Operator session</h3>
            </div>
            <span className="connection-chip connection-chip--reachable">authenticated</span>
          </div>
          <dl className="detail-list">
            <div><dt>Organization</dt><dd>{session.organization.name}</dd></div>
            <div><dt>Organization slug</dt><dd>{session.organization.slug}</dd></div>
            <div><dt>Operator</dt><dd>{session.user.fullName}</dd></div>
            <div><dt>Email</dt><dd>{session.user.email}</dd></div>
            <div><dt>Role</dt><dd>{session.user.role}</dd></div>
            <div><dt>Session expires</dt><dd>{expiresAt}</dd></div>
          </dl>
          <p className="panel-note">
            The access token is tab-scoped through sessionStorage. It is not stored in localStorage and is removed on logout or invalid session verification.
          </p>
        </article>

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
            Port 3001 matches the backend development CORS configuration. Production URLs are supplied through environment configuration.
          </p>
        </article>
      </section>

      <section className="panel roadmap-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Delivery plan</span>
            <h3>Web phases</h3>
          </div>
          <span className="roadmap-progress">2 / 7 phases</span>
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
