import { Navigate, Route, Routes } from 'react-router-dom';

import { ADMIN_ROLES, SUPERVISOR_MANAGEMENT_ROLES } from './auth/navigation';
import { ProtectedRoute, RequireRoles } from './auth/RouteGuards';
import { AppShell } from './components/AppShell';
import { AlertCenterPage } from './pages/AlertCenterPage';
import { AlertDetailPage } from './pages/AlertDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { DashboardPage } from './pages/DashboardPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { LiveFleetPage } from './pages/LiveFleetPage';
import { LoginPage } from './pages/LoginPage';
import { SafetyEventDetailPage } from './pages/SafetyEventDetailPage';
import { SafetyEventsPage } from './pages/SafetyEventsPage';

export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="overview" element={<Navigate to="/" replace />} />
          <Route path="live-fleet" element={<LiveFleetPage />} />
          <Route path="alerts" element={<AlertCenterPage />} />
          <Route path="alerts/:alertId" element={<AlertDetailPage />} />
          <Route path="safety-events" element={<SafetyEventsPage />} />
          <Route path="safety-events/:eventId" element={<SafetyEventDetailPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
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
