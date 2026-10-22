import DataRow from '../components/DataRow';
import LoadError from '../components/LoadError';
import Icon from '../components/Icon';
import { useState, useEffect } from 'react';
import { getUsers, updateUserStatus, updateUserRole, deleteUser } from '../services/adminService';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        console.error(err);
        setLoadError('Unable to load this page. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function handleStatusChange(id, status) {
    if (busyId !== null) return;
    setBusyId(id);
    setNotice('');
    try {
      const result = await updateUserStatus(id, status);
      if (result.activationEmailSent === false) {
        setNotice('The account is active, but the welcome email could not be sent.');
      }
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    } catch (err) {
      setNotice(err.response?.data?.message || 'An error occurred');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRoleChange(id, currentRoles) {
    if (busyId !== null) return;
    const isAdmin = currentRoles.includes('ROLE_ADMIN');
    const newRoles = isAdmin ? ['ROLE_USER'] : ['ROLE_ADMIN', 'ROLE_USER'];
    if (!window.confirm(`${isAdmin ? 'Remove' : 'Grant'} admin role for this user?`)) return;
    setBusyId(id);
    setNotice('');
    try {
      await updateUserRole(id, newRoles);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, roles: newRoles } : u));
    } catch (err) {
      setNotice(err.response?.data?.message || 'An error occurred');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (busyId !== null) return;
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    setBusyId(id);
    setNotice('');
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      setNotice(err.response?.data?.message || 'Cannot delete this user');
    } finally {
      setBusyId(null);
    }
  }

  const filtered = users.filter(u => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'disabled' ? u.status !== 'active' : u.status === filterStatus);
    return matchSearch && matchStatus;
  });

  if (loadError) return <LoadError message={loadError} />;
  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div className="admin-page admin-page-users">
      <div className="admin-page-header" style={styles.header}>
        <div>
          <h1 style={styles.title}>Users management</h1>
          <p style={styles.subtitle}>{users.length} users registered</p>
        </div>
      </div>

      {notice && <div role="status" className="admin-notice">{notice}</div>}
      <div className="admin-card" style={styles.card}>
        <div className="admin-toolbar" style={styles.toolbar}>
          <div className="admin-filters" style={styles.filters}>
            {['all', 'active', 'disabled'].map(f => (
              <button
                key={f}
                aria-pressed={filterStatus === f} onClick={() => setFilterStatus(f)}
                style={{
                  ...styles.filterBtn,
                  ...(filterStatus === f ? styles.filterBtnActive : {})
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="admin-search" style={styles.searchBar}>
            <span><Icon name="search" /></span>
            <input
              type="text"
              aria-label="Search users" placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        <div className="admin-table-head" style={styles.tableHeader}>
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
            <DataRow key={user.id} labels={["Name", "Email", "Role", "Status", "Actions"]} style={styles.tableRow}>
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
                  {user.status === 'active' ? 'Active' : 'Disabled'}
                </span>
              </span>
              <span style={styles.actions} aria-busy={busyId === user.id}>
                {busyId === user.id && <span role="status">Saving...</span>}
                {user.status !== 'active' && (
                  <button disabled={busyId !== null} style={styles.btnApprove} onClick={() => handleStatusChange(user.id, 'active')}>
                    Activate
                  </button>
                )}
                {user.status !== 'rejected' && (
                  <button disabled={busyId !== null} style={styles.btnReject} onClick={() => handleStatusChange(user.id, 'rejected')}>
                    Disable
                  </button>
                )}
                <button
                  disabled={busyId !== null} style={styles.btnRole}
                  onClick={() => handleRoleChange(user.id, user.roles)}
                >
                  {user.roles.includes('ROLE_ADMIN') ? 'Remove Admin' : 'Make Admin'}
                </button>
                <button disabled={busyId !== null} style={styles.btnDelete} onClick={() => handleDelete(user.id)}>
                  Delete
                </button>
              </span>
            </DataRow>
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
