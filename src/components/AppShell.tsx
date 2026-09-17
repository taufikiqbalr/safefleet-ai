import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navigation = [
  { to: '/', label: 'Overview', phase: 'W0', monogram: 'OV' },
  { to: '/live-fleet', label: 'Live Fleet', phase: 'W2', monogram: 'LF' },
  { to: '/alerts', label: 'Alert Center', phase: 'W3', monogram: 'AL' },
  { to: '/safety-events', label: 'Safety Events', phase: 'W4', monogram: 'SE' },
  { to: '/analytics', label: 'Analytics', phase: 'W4', monogram: 'AN' },
  { to: '/drivers', label: 'Drivers', phase: 'W5', monogram: 'DR' },
  { to: '/vehicles', label: 'Vehicles', phase: 'W5', monogram: 'VH' },
  { to: '/devices', label: 'Devices', phase: 'W5', monogram: 'DV' },
  { to: '/risk-policies', label: 'Risk Policies', phase: 'W5', monogram: 'RP' },
  { to: '/settings', label: 'Settings', phase: 'W5', monogram: 'ST' },
];

const pageNames = new Map(navigation.map((item) => [item.to, item.label]));

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const pageTitle = pageNames.get(location.pathname) ?? 'SafeFleet AI';

  return (
    <div className="app-frame">
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <span>SF</span>
          </div>
          <div>
            <strong>SafeFleet AI</strong>
            <span>Fleet Safety Platform</span>
          </div>
        </div>

        <div className="workspace-pill">
          <span className="workspace-dot" />
          <div>
            <strong>Web Foundation</strong>
            <small>Phase W0</small>
          </div>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
            >
              <span className="nav-monogram" aria-hidden="true">{item.monogram}</span>
              <span className="nav-label">{item.label}</span>
              <span className="phase-tag">{item.phase}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="eyebrow">Architecture</span>
          <strong>Mobile → Backend → Web</strong>
          <small>Operational data only. Immediate driver alarms stay on-device.</small>
        </div>
      </aside>

      <div className="page-frame">
        <header className="topbar">
          <div className="topbar-title">
            <button
              type="button"
              className="menu-button"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              ☰
            </button>
            <div>
              <span className="eyebrow">SafeFleet Operations</span>
              <h1>{pageTitle}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="environment-badge">LOCAL / W0</span>
            <div className="operator-avatar" aria-label="Authentication arrives in W1">OP</div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
    </div>
  );
}
