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
              <span>
                <div style={styles.userInfo}>
                  <div style={{
                    ...styles.avatar,
                    backgroundColor: user.roles.includes('ROLE_ADMIN') ? '#0B1E3D' : '#2563EB'
                  }}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <span style={styles.userName}>{user.firstName} {user.lastName}</span>
                </div>
              </span>
              <span style={styles.userEmail}>{user.email}</span>
              <span>
                <span style={{
                  ...styles.roleBadge,
                  backgroundColor: user.roles.includes('ROLE_ADMIN') ? '#0B1E3D' : 'var(--color-bg-soft)',
                  color: user.roles.includes('ROLE_ADMIN') ? '#fff' : 'var(--color-text-light)',
                }}>
                  {user.roles.includes('ROLE_ADMIN') ? 'Admin' : 'User'}
                </span>
              </span>
              <span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor:
                    user.status === 'active' ? '#ECFDF5' :
                    user.status === 'pending' ? '#FFFBEB' : '#FEF2F2',
                  color:
                    user.status === 'active' ? '#16A34A' :
                    user.status === 'pending' ? '#D97706' : '#DC2626',
                }}>
                  {user.status}
                </span>
              </span>
              <span style={styles.actions}>
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
    color: 'var(--color-text-light)',
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  card: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '24px',
    fontFamily: 'Inter, sans-serif',
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
    gap: '4px',
    backgroundColor: 'var(--color-bg)',
    borderRadius: '10px',
    padding: '4px',
  },
  filterBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
    color: 'var(--color-text-light)',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: 'var(--color-white)',
    color: '#2563EB',
    boxShadow: '0 1px 3px rgba(11,30,61,0.08)',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--color-input-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: '10px 14px',
    flex: 1,
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    color: 'var(--color-text)',
    flex: 1,
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 2.2fr',
    padding: '12px 0',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '8px',
  },
  col: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '700',
    letterSpacing: '0.06em',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 2.2fr',
    padding: '13px 0',
    borderBottom: '1px solid var(--color-bg-soft)',
    alignItems: 'center',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    color: '#fff',
    flexShrink: 0,
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  userEmail: {
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
  },
  roleBadge: {
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '700',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  actions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  btnApprove: {
    backgroundColor: '#ECFDF5',
    color: '#16A34A',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
  },
  btnReject: {
    backgroundColor: '#FFFBEB',
    color: '#D97706',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
  },
  btnRole: {
    backgroundColor: 'var(--color-bg-soft)',
    color: '#2563EB',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
  },
  btnDelete: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--color-text-light)',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
    padding: '40px 0',
  },
};