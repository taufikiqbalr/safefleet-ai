import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { navigationForRole, navigationItems } from '../auth/navigation';

const pageNames = new Map(navigationItems.map((item) => [item.to, item.label]));

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'OP';
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const auth = useAuth();
  const session = auth.session!;
  const navigation = navigationForRole(session.user.role);
  const pageTitle = pageNames.get(location.pathname) ?? (location.pathname === '/forbidden' ? 'Access restricted' : 'SafeFleet AI');

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
            <strong>{session.organization.name}</strong>
            <small>{session.user.role} · {session.organization.slug}</small>
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
          <span className="eyebrow">Signed in</span>
          <strong>{session.user.fullName}</strong>
          <small>{session.user.email}</small>
          <button type="button" className="sidebar-logout" onClick={() => auth.logout()}>
            Sign out
          </button>
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
            <span className="environment-badge">W1 · {session.user.role}</span>
            <div className="operator-identity">
              <div>
                <strong>{session.user.fullName}</strong>
                <span>{session.organization.name}</span>
              </div>
              <div className="operator-avatar" aria-label={`Signed in as ${session.user.fullName}`}>
                {initials(session.user.fullName)}
              </div>
            </div>
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
