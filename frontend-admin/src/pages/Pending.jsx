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
    color: '#6b7280',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#6b7280',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#1a1a1a',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#d97706',
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
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userEmail: {
    fontSize: '13px',
    color: '#6b7280',
  },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pendingBadge: {
    backgroundColor: '#fef9e7',
    color: '#d97706',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  btnApprove: {
    backgroundColor: '#00C49A',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnReject: {
    backgroundColor: '#fde8e8',
    color: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};