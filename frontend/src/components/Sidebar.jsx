import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { logout } from '../services/authService';
import { getUnreadCount } from '../services/notificationService';
import '../styles/sidebar.css';

const LogoIcon = () => (
  <div style={{
    width: '34px', height: '34px', borderRadius: '9px', backgroundColor: '#2563EB',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', fontWeight: '800', color: '#fff', flexShrink: 0,
  }}>N</div>
);

const moonIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const sunIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const bellIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

export default function Sidebar() {
  const navigate = useNavigate();
  const { dark, toggleDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';
  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName?.[0] ? user.lastName[0] + '.' : ''}`.trim()
    : 'Account holder';

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnread() {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (_) {}
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="topbar">
      {/* Brand */}
      <NavLink to="/dashboard" className="topbar-brand">
        <LogoIcon />
        <span className="topbar-brand-text">Nexo Finance</span>
      </NavLink>

      {/* Nav */}
      <nav className="topbar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>
          <span className="topbar-link-emoji">📊</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/operations" className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>
          <span className="topbar-link-emoji">💰</span>
          <span>Operations</span>
        </NavLink>
        <NavLink to="/categories" className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>
          <span className="topbar-link-emoji">🏷️</span>
          <span>Categories</span>
        </NavLink>
      </nav>

      {/* Actions */}
      <div className="topbar-actions">
        <button className="topbar-icon-btn" onClick={toggleDark} title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? sunIcon : moonIcon}
        </button>

        <NavLink to="/notifications" className="topbar-icon-btn topbar-bell" title="Notifications">
          {bellIcon}
          {unreadCount > 0 && (
            <span className="topbar-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </NavLink>

        <div className="topbar-user-wrap" ref={menuRef}>
          <button className="topbar-user" onClick={() => setMenuOpen(o => !o)}>
            <div className="topbar-avatar">{initials}</div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{displayName}</span>
              <span className="topbar-user-role">Account holder</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ color: 'var(--color-text-light)', marginLeft: '2px', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {menuOpen && (
            <div className="topbar-dropdown">
              <button className="topbar-dropdown-item" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                My profile
              </button>
              <div className="topbar-dropdown-divider" />
              <button className="topbar-dropdown-item topbar-dropdown-logout" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
