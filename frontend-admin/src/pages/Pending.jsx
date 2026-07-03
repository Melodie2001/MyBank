import { useState, useEffect } from 'react';
import { getUsers, updateUserStatus } from '../services/adminService';

export default function Pending() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    try {
      const data = await getUsers();
      setPendingUsers(data.filter(u => u.status === 'pending'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateUserStatus(id, status);
      setPendingUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'An error occurred');
    }
  }

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Pending approvals</h1>
          <p style={styles.subtitle}>
            {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} waiting for approval
          </p>
        </div>
      </div>

      {pendingUsers.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>✅</div>
          <h2 style={styles.emptyTitle}>All caught up!</h2>
          <p style={styles.emptyText}>No pending registrations at the moment.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {pendingUsers.map(user => (
            <div key={user.id} style={styles.card}>
              <div style={styles.cardLeft}>
                <div style={styles.avatar}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div style={styles.userInfo}>
                  <div style={styles.userName}>{user.firstName} {user.lastName}</div>
                  <div style={styles.userEmail}>{user.email}</div>
                </div>
              </div>
              <div style={styles.cardRight}>
                <span style={styles.pendingBadge}>Pending</span>
                <button
                  style={styles.btnApprove}
                  onClick={() => handleStatusChange(user.id, 'active')}
                >
                  ✓ Approve
                </button>
                <button
                  style={styles.btnReject}
                  onClick={() => handleStatusChange(user.id, 'rejected')}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '16px',
    color: 'var(--color-text-light)',
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    fontFamily: 'Inter, sans-serif',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    marginBottom: '8px',
    color: 'var(--color-text)',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#D97706',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  userName: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  userEmail: {
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
  },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pendingBadge: {
    backgroundColor: '#FFFBEB',
    color: '#D97706',
    padding: '5px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '700',
  },
  btnApprove: {
    backgroundColor: '#16A34A',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
  },
  btnReject: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: 'none',
    borderRadius: '10px',
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
  },
};