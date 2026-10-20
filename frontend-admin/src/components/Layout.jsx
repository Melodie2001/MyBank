import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
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
        <Outlet />
      </main>
    </div>
  );
}
