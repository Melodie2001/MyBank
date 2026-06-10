import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/sidebar.css';

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  operations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  category: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
    </svg>
  ),
  signout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const LogoIcon = () => (
  <div style={{
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#F8E16C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: 0,
  }}>
    🏦
  </div>
);

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';
  const fullName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`
    : 'Account holder';

  function handleSignOut() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  function handleNavClick() {
    if (onClose) onClose();
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <LogoIcon />
        <span>
          <span style={{ color: '#fff', fontWeight: '400' }}>my</span>
          <span style={{ color: '#00C49A', fontWeight: '700' }}>Bank</span>
        </span>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          onClick={handleNavClick}
        >
          {icons.dashboard}
          Dashboard
        </NavLink>

        <NavLink
          to="/operations"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          onClick={handleNavClick}
        >
          {icons.operations}
          Operations
        </NavLink>

        <NavLink
          to="/categories"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          onClick={handleNavClick}
        >
          {icons.category}
          Category
        </NavLink>
      </nav>

      <div className="sidebar-signout">
        <button
          className="sidebar-link"
          onClick={handleSignOut}
          style={{ width: '100%', background: 'none', border: 'none' }}
        >
          {icons.signout}
          Sign out
        </button>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{fullName}</span>
          <span className="sidebar-user-role">Account holder</span>
        </div>
      </div>
    </aside>
  );
}