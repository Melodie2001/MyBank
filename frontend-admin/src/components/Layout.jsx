import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getUsers } from '../services/adminService';

export default function Layout() {
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPending = useCallback(async () => {
    try {
      const users = await getUsers();
      const pending = users.filter(u => u.status === 'pending').length;
      setPendingCount(pending);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function pollPending() {
      try {
        const users = await getUsers();
        if (active) setPendingCount(users.filter(user => user.status === 'pending').length);
      } catch (error) {
        console.error(error);
      }
    }
    pollPending();
    const interval = setInterval(pollPending, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar pendingCount={pendingCount} />
      <main style={{
        marginLeft: '252px',
        marginTop: '12px',
        marginRight: '12px',
        marginBottom: '12px',
        flex: 1,
        padding: '32px',
        overflowY: 'auto',
        backgroundColor: 'var(--color-bg)',
        borderRadius: '16px',
      }}>
        <Outlet context={{ refreshPendingCount: fetchPending }} />
      </main>
    </div>
  );
}