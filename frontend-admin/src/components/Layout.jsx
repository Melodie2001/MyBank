import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const toggleRef = useRef(null);
  function closeMenu() { setMenuOpen(false); toggleRef.current?.focus(); }
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const sidebar = sidebarRef.current;
    sidebar?.querySelector('button, a')?.focus();
    function handleKey(event) {
      if (event.key === 'Escape') { setMenuOpen(false); toggleRef.current?.focus(); }
      if (event.key !== 'Tab') return;
      const items = sidebar?.querySelectorAll('a, button');
      const first = items?.[0];
      const last = items?.[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', handleKey);
    function handleResize() { if (window.innerWidth > 900) setMenuOpen(false); }
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);
  return (
    <div className="admin-layout">
      <a className="skip-link" href="#admin-main">Skip to content</a>
      <header className="admin-mobile-header">
        <span>Nexo Finance <small>ADMIN</small></span>
        <button ref={toggleRef} type="button" aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen(true)}>Menu</button>
      </header>
      {menuOpen && <button className="admin-backdrop" aria-label="Close navigation" onClick={closeMenu} />}
      <Sidebar open={menuOpen} onClose={closeMenu} sidebarRef={sidebarRef} />
      <main id="admin-main" tabIndex={-1} inert={menuOpen} className="admin-main"><Outlet /></main>
    </div>
  );
}
