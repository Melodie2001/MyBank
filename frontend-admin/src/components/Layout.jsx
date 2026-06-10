import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getUsers } from '../services/adminService';

export default function Layout() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchPending() {
      try {
        const users = await getUsers();
        const pending = users.filter(u => u.status === 'pending').length;
        setPendingCount(pending);
      } catch (err) {
        console.error(err);
      }
    }

    fetchPending();
    // Polling toutes les 30 secondes
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar pendingCount={pendingCount} />
      <main style={{
        marginLeft: '220px',
        flex: 1,
        padding: '32px',
        overflowY: 'auto',
        backgroundColor: '#E8F0EF',
      }}>
        <Outlet />
      </main>
    </div>
  );
}