import { Navigate, Route, Routes } from 'react-router-dom';

import { ADMIN_ROLES, SUPERVISOR_MANAGEMENT_ROLES } from './auth/navigation';
import { ProtectedRoute, RequireRoles } from './auth/RouteGuards';
import { AppShell } from './components/AppShell';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { FoundationPage } from './pages/FoundationPage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<FoundationPage />} />
          <Route path="overview" element={<Navigate to="/" replace />} />
          <Route path="live-fleet" element={<ComingSoonPage phase="W2" title="Live Fleet" />} />
          <Route path="alerts" element={<ComingSoonPage phase="W3" title="Alert Center" />} />
          <Route path="safety-events" element={<ComingSoonPage phase="W4" title="Safety Events" />} />
          <Route path="analytics" element={<ComingSoonPage phase="W4" title="Analytics" />} />
          <Route path="forbidden" element={<ForbiddenPage />} />

          <Route element={<RequireRoles roles={SUPERVISOR_MANAGEMENT_ROLES} />}>
            <Route path="drivers" element={<ComingSoonPage phase="W5" title="Drivers" />} />
            <Route path="vehicles" element={<ComingSoonPage phase="W5" title="Vehicles" />} />
            <Route path="devices" element={<ComingSoonPage phase="W5" title="Devices" />} />
          </Route>

          <Route element={<RequireRoles roles={ADMIN_ROLES} />}>
            <Route path="risk-policies" element={<ComingSoonPage phase="W5" title="Risk Policies" />} />
            <Route path="settings" element={<ComingSoonPage phase="W5" title="Organization Settings" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
