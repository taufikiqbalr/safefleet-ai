import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { appConfig } from '../lib/config';

type LocationState = { from?: string };

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (auth.status === 'authenticated' && auth.session) {
    return <Navigate to="/" replace />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await auth.login({ organizationSlug, email, password });
      const from = (location.state as LocationState | null)?.from;
      navigate(from && from.startsWith('/') ? from : '/', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    }
  };

  const busy = auth.status === 'authenticating';

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <div className="brand-block login-brand-block">
            <div className="brand-mark" aria-hidden="true"><span>SF</span></div>
            <div>
              <strong>SafeFleet AI</strong>
              <span>Driver Safety Management Platform</span>
            </div>
          </div>
          <span className="login-phase">Phase W1 · Authentication</span>
          <h1>Fleet safety operations begin with an authenticated tenant session.</h1>
          <p>
            Sign in with the organization account issued by SafeFleet Backend. Fleet identity and authorization are resolved by the backend, not selected by browser-supplied IDs.
          </p>
          <div className="login-boundary-grid">
            <div><strong>Mobile</strong><span>Perception + local alarm</span></div>
            <div><strong>Backend</strong><span>Risk + tenant authorization</span></div>
            <div><strong>Web</strong><span>Supervisor operations</span></div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div>
            <span className="eyebrow">Operator access</span>
            <h2>Sign in to SafeFleet</h2>
            <p>Use your organization slug, email address, and password.</p>
          </div>

          <form onSubmit={(event) => void submit(event)} className="login-form">
            <label>
              <span>Organization slug</span>
              <input
                type="text"
                value={organizationSlug}
                onChange={(event) => setOrganizationSlug(event.target.value)}
                autoComplete="organization"
                placeholder="safefleet-demo"
                required
                disabled={busy}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                placeholder="operator@example.com"
                required
                disabled={busy}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••••••"
                required
                disabled={busy}
              />
            </label>

            {(error ?? auth.error) ? (
              <div className="login-error" role="alert">{error ?? auth.error}</div>
            ) : null}

            <button className="button login-submit" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="login-meta">
            <span>API endpoint</span>
            <code>{appConfig.apiBaseUrl}</code>
            <p>Access tokens are kept in memory and sessionStorage for this browser tab; they are not persisted to localStorage.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
