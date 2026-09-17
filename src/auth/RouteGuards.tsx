import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './AuthContext';
import type { UserRole } from './types';

export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'bootstrapping' || auth.status === 'authenticating') {
    return <AuthGate title="Verifying SafeFleet session" detail="Checking your user and organization context…" />;
  }

  if (auth.status === 'unavailable') {
    return (
      <AuthGate
        title="Backend unavailable"
        detail={auth.error ?? 'The saved session could not be verified.'}
        actions={(
          <div className="auth-gate-actions">
            <button className="button button--primary" type="button" onClick={() => void auth.retryBootstrap()}>
              Retry verification
            </button>
            <button className="button auth-secondary-button" type="button" onClick={() => auth.logout()}>
              Sign out
            </button>
          </div>
        )}
      />
    );
  }

  if (auth.status !== 'authenticated' || !auth.session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RequireRoles({ roles }: { roles: readonly UserRole[] }) {
  const auth = useAuth();
  if (!auth.session || !auth.hasAnyRole(roles)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}

function AuthGate({
  title,
  detail,
  actions,
}: {
  title: string;
  detail: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="auth-gate">
      <div className="auth-gate-card">
        <div className="brand-mark auth-gate-mark" aria-hidden="true"><span>SF</span></div>
        <span className="eyebrow">SafeFleet AI</span>
        <h1>{title}</h1>
        <p>{detail}</p>
        {actions}
      </div>
    </div>
  );
}
