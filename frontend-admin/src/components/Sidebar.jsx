import { NavLink, useNavigate } from 'react-router-dom';
import { logout, getUser } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  pending: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  operations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  signout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

export default function Sidebar({ pendingCount = 0 }) {
  const navigate = useNavigate();
  const { dark, toggleDark } = useTheme();
  const user = getUser();

  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'A';

  const fullName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`
    : 'Admin';

  function handleSignOut() {
    logout();
    navigate('/login');
  }

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>N</div>
        <span style={styles.logoText}>
          Nexo Finance
          <span style={styles.adminBadge}>ADMIN</span>
        </span>
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        <NavLink
          to="/dashboard"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
        >
          {icons.dashboard}
          Dashboard
        </NavLink>

        <NavLink
          to="/users"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
        >
          {icons.users}
          Users
        </NavLink>

        <NavLink
          to="/pending"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
        >
          {icons.pending}
          Pending approvals
          {pendingCount > 0 && (
            <span style={styles.badge}>{pendingCount}</span>
          )}
        </NavLink>

        <NavLink
          to="/operations"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
        >
          {icons.operations}
          All operations
        </NavLink>
      </nav>

      {/* Dark mode toggle */}
      <div style={styles.signoutWrapper}>
        <button style={styles.signout} onClick={toggleDark}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {dark
              ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
              : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            }
          </svg>
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>

      {/* Sign out */}
      <div style={styles.signoutWrapper}>
        <button style={styles.signout} onClick={handleSignOut}>
          {icons.signout}
          Sign out
        </button>
      </div>

      {/* User */}
      <div style={styles.user}>
        <div style={styles.avatar}>{initials}</div>
        <div style={styles.userInfo}>
          <span style={styles.userName}>{fullName}</span>
          <span style={styles.userRole}>Administrator</span>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '240px',
    height: '100vh',
    backgroundColor: '#0B1E3D',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    padding: '24px 0',
    fontFamily: 'Montserrat, sans-serif',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 20px',
    marginBottom: '32px',
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '11px',
    backgroundColor: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '17px',
    fontWeight: '800',
    color: '#fff',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  adminBadge: {
    backgroundColor: 'rgba(37,99,235,0.18)',
    color: '#7DA8FF',
    fontSize: '9px',
    fontWeight: '800',
    padding: '3px 7px',
    borderRadius: '6px',
    letterSpacing: '0.05em',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 12px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '12px',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'background 0.15s, color 0.15s',
    textDecoration: 'none',
  },
  linkActive: {
    backgroundColor: 'rgba(37,99,235,0.18)',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#2563EB',
    color: '#fff',
    borderRadius: '999px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  signoutWrapper: {
    padding: '0 12px',
    marginBottom: '12px',
  },
  signout: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '12px',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    fontSize: '14px',
    background: 'none',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
  },
  user: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 20px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '13px',
    color: '#fff',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: '13px',
  },
  userRole: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '11px',
  },
};