import { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUserStatus, deleteUser, getAllOperations } from '../services/adminService';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [operations, setOperations] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [usersData, opsData] = await Promise.all([
        getUsers(),
        getAllOperations()
      ]);
      setUsers(usersData);
      setOperations(opsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusChange(id, status) {
    try {
      await updateUserStatus(id, status);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'An error occurred');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete this user');
    }
  }

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'active');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Administration</h1>
          <p style={styles.subtitle}>Manage users and operations</p>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>TOTAL USERS</div>
          <div style={styles.statValue}>{users.length}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #F8E16C' }}>
          <div style={styles.statLabel}>PENDING</div>
          <div style={{ ...styles.statValue, color: '#d97706' }}>{pendingUsers.length}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #00C49A' }}>
          <div style={styles.statLabel}>ACTIVE</div>
          <div style={{ ...styles.statValue, color: '#00C49A' }}>{activeUsers.length}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #ef4444' }}>
          <div style={styles.statLabel}>REJECTED</div>
          <div style={{ ...styles.statValue, color: '#ef4444' }}>{rejectedUsers.length}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>TOTAL OPERATIONS</div>
          <div style={styles.statValue}>{operations.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'users' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('users')}
        >
          Users management
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'pending' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('pending')}
        >
          Pending approvals
          {pendingUsers.length > 0 && (
            <span style={styles.badge}>{pendingUsers.length}</span>
          )}
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'operations' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('operations')}
        >
          All operations
        </button>
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div style={styles.card}>
          <div style={styles.tableHeader}>
            <span style={styles.col}>NAME</span>
            <span style={styles.col}>EMAIL</span>
            <span style={styles.col}>ROLE</span>
            <span style={styles.col}>STATUS</span>
            <span style={styles.col}>ACTIONS</span>
          </div>
          {users.length === 0 ? (
            <div style={styles.empty}>No users found</div>
          ) : (
            users.map(user => (
              <div key={user.id} style={styles.tableRow}>
                <span style={styles.col}>
                  <div style={styles.userInfo}>
                    <div style={{
                      ...styles.avatar,
                      backgroundColor: user.roles.includes('ROLE_ADMIN') ? '#156064' : '#00C49A'
                    }}>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <span>{user.firstName} {user.lastName}</span>
                  </div>
                </span>
                <span style={styles.col}>{user.email}</span>
                <span style={styles.col}>
                  <span style={{
                    ...styles.roleBadge,
                    backgroundColor: user.roles.includes('ROLE_ADMIN') ? '#156064' : '#e5e9e8',
                    color: user.roles.includes('ROLE_ADMIN') ? '#fff' : '#374151',
                  }}>
                    {user.roles.includes('ROLE_ADMIN') ? 'Admin' : 'User'}
                  </span>
                </span>
                <span style={styles.col}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor:
                      user.status === 'active' ? '#e6faf5' :
                      user.status === 'pending' ? '#fef9e7' : '#fde8e8',
                    color:
                      user.status === 'active' ? '#00C49A' :
                      user.status === 'pending' ? '#d97706' : '#ef4444',
                  }}>
                    {user.status}
                  </span>
                </span>
                <span style={{ ...styles.col, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {user.status !== 'active' && (
                    <button
                      style={styles.btnApprove}
                      onClick={() => handleStatusChange(user.id, 'active')}
                    >
                      Approve
                    </button>
                  )}
                  {user.status !== 'rejected' && (
                    <button
                      style={styles.btnReject}
                      onClick={() => handleStatusChange(user.id, 'rejected')}
                    >
                      Reject
                    </button>
                  )}
                  <button
                    style={styles.btnDelete}
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending tab */}
      {activeTab === 'pending' && (
        <div style={styles.card}>
          <div style={styles.tableHeader}>
            <span style={styles.col}>NAME</span>
            <span style={styles.col}>EMAIL</span>
            <span style={styles.col}>ACTIONS</span>
          </div>
          {pendingUsers.length === 0 ? (
            <div style={styles.empty}>No pending approvals</div>
          ) : (
            pendingUsers.map(user => (
              <div key={user.id} style={styles.tableRow}>
                <span style={styles.col}>
                  <div style={styles.userInfo}>
                    <div style={{ ...styles.avatar, backgroundColor: '#d97706' }}>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <span>{user.firstName} {user.lastName}</span>
                  </div>
                </span>
                <span style={styles.col}>{user.email}</span>
                <span style={{ ...styles.col, display: 'flex', gap: '6px' }}>
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
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Operations tab */}
      {activeTab === 'operations' && (
        <div style={styles.card}>
          <div style={styles.tableHeader}>
            <span style={styles.col}>DESCRIPTION</span>
            <span style={styles.col}>USER</span>
            <span style={styles.col}>CATEGORY</span>
            <span style={styles.col}>DATE</span>
            <span style={styles.col}>AMOUNT</span>
          </div>
          {operations.length === 0 ? (
            <div style={styles.empty}>No operations found</div>
          ) : (
            operations.map(op => (
              <div key={op.id} style={styles.tableRow}>
                <span style={styles.col}>{op.label}</span>
                <span style={styles.col}>{op.user.email}</span>
                <span style={styles.col}>
                  <span style={{
                    ...styles.categoryBadge,
                    backgroundColor: op.category.color + '22',
                    color: op.category.color
                  }}>
                    {op.category.name}
                  </span>
                </span>
                <span style={styles.col}>{op.date}</span>
                <span style={{
                  ...styles.col,
                  fontWeight: '600',
                  color: op.type === 'income' ? '#00C49A' : '#ef4444'
                }}>
                  {op.type === 'income' ? '+' : '-'}{Number(op.amount).toFixed(2)} €
                </span>
              </div>
            ))
          )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    borderLeft: '4px solid #e5e9e8',
  },
  statLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '16px',
    borderBottom: '2px solid #f3f4f6',
    paddingBottom: '0',
  },
  tab: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6b7280',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tabActive: {
    color: '#00C49A',
    borderBottom: '2px solid #00C49A',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#ef4444',
    color: '#fff',
    borderRadius: '10px',
    padding: '2px 7px',
    fontSize: '11px',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1.5fr',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
    marginBottom: '8px',
  },
  col: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: '0.03em',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1.5fr',
    padding: '12px 0',
    borderBottom: '1px solid #f9fafb',
    alignItems: 'center',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    color: '#fff',
    flexShrink: 0,
    textTransform: 'uppercase',
  },
  roleBadge: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  statusBadge: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  btnApprove: {
    backgroundColor: '#e6faf5',
    color: '#00C49A',
    border: 'none',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnReject: {
    backgroundColor: '#fef9e7',
    color: '#d97706',
    border: 'none',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnDelete: {
    backgroundColor: '#fde8e8',
    color: '#ef4444',
    border: 'none',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    padding: '40px 0',
  },
};