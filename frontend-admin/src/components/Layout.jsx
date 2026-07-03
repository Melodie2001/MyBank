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
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [fetchPending]);

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