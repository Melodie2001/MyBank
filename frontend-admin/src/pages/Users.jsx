import { useState, useEffect } from 'react';
import { getUsers, updateUserStatus, updateUserRole, deleteUser } from '../services/adminService';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateUserStatus(id, status);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'An error occurred');
    }
  }

  async function handleRoleChange(id, currentRoles) {
    const isAdmin = currentRoles.includes('ROLE_ADMIN');
    const newRoles = isAdmin ? ['ROLE_USER'] : ['ROLE_ADMIN', 'ROLE_USER'];
    if (!window.confirm(`${isAdmin ? 'Remove' : 'Grant'} admin role for this user?`)) return;
    try {
      await updateUserRole(id, newRoles);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, roles: newRoles } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'An error occurred');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete this user');
    }
  }

  const filtered = users.filter(u => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Users management</h1>
          <p style={styles.subtitle}>{users.length} users registered</p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <div style={styles.filters}>
            {['all', 'active', 'pending', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                style={{
                  ...styles.filterBtn,
                  ...(filterStatus === f ? styles.filterBtnActive : {})
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={styles.searchBar}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={styles.tableHeader}>
          <span style={styles.col}>NAME</span>
          <span style={styles.col}>EMAIL</span>
          <span style={styles.col}>ROLE</span>
          <span style={styles.col}>STATUS</span>
          <span style={styles.col}>ACTIONS</span>
        </div>

        {filtered.length === 0 ? (
          <div style={styles.empty}>No users found</div>
        ) : (
          filtered.map(user => (
            <div key={user.id} style={styles.tableRow}>
              <span style={styles.col}>
                <div style={styles.userInfo}>
                  <div style={{
                    ...styles.avatar,
                    backgroundColor: user.roles.includes('ROLE_ADMIN') ? '#156064' : '#00C49A'
                  }}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <span style={{ fontSize: '13px' }}>{user.firstName} {user.lastName}</span>
                </div>
              </span>
              <span style={{ ...styles.col, fontSize: '13px' }}>{user.email}</span>
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
                  <button style={styles.btnApprove} onClick={() => handleStatusChange(user.id, 'active')}>
                    Approve
                  </button>
                )}
                {user.status !== 'rejected' && (
                  <button style={styles.btnReject} onClick={() => handleStatusChange(user.id, 'rejected')}>
                    Reject
                  </button>
                )}
                <button
                  style={styles.btnRole}
                  onClick={() => handleRoleChange(user.id, user.roles)}
                >
                  {user.roles.includes('ROLE_ADMIN') ? 'Remove Admin' : 'Make Admin'}
                </button>
                <button style={styles.btnDelete} onClick={() => handleDelete(user.id)}>
                  Delete
                </button>
              </span>
            </div>
          ))
        )}
      </div>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filters: {
    display: 'flex',
    gap: '6px',
  },
  filterBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6b7280',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#156064',
    color: '#fff',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '8px 12px',
    flex: 1,
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '13px',
    flex: 1,
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 2fr',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
    marginBottom: '8px',
  },
  col: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: '0.05em',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 2fr',
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
  btnRole: {
    backgroundColor: '#ede9fe',
    color: '#7c3aed',
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