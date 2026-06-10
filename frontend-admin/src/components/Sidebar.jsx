import { NavLink, useNavigate } from 'react-router-dom';
import { logout, getUser } from '../services/authService';

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
        <div style={styles.logoIcon}>🏦</div>
        <span style={styles.logoText}>
          <span style={{ color: '#fff', fontWeight: '400' }}>my</span>
          <span style={{ color: '#00C49A', fontWeight: '700' }}>Bank</span>
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
    width: '220px',
    height: '100vh',
    backgroundColor: '#156064',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    padding: '24px 0',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 20px',
    marginBottom: '32px',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#F8E16C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  adminBadge: {
    backgroundColor: '#00C49A',
    color: '#fff',
    fontSize: '9px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
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
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    fontSize: '13px',
    transition: 'all 0.2s',
    textDecoration: 'none',
  },
  linkActive: {
    backgroundColor: '#00C49A',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#ef4444',
    color: '#fff',
    borderRadius: '10px',
    padding: '2px 7px',
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
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    fontSize: '13px',
    background: 'none',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
  },
  user: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#F8E16C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '13px',
    color: '#156064',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: '12px',
  },
  userRole: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '11px',
  },
};