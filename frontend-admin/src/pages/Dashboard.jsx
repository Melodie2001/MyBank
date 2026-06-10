import { useState, useEffect } from 'react';
import { getUsers, getAllOperations } from '../services/adminService';

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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
    }
    fetchData();
  }, []);

  const totalIncome = operations
    .filter(op => op.type === 'income')
    .reduce((sum, op) => sum + Number(op.amount), 0);

  const totalExpenses = operations
    .filter(op => op.type === 'expense')
    .reduce((sum, op) => sum + Number(op.amount), 0);

  const activeUsers = users.filter(u => u.status === 'active').length;
  const pendingUsers = users.filter(u => u.status === 'pending').length;
  const rejectedUsers = users.filter(u => u.status === 'rejected').length;

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Overview of MyBank platform</p>
      </div>

      {/* Stats */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>TOTAL USERS</div>
          <div style={styles.cardValue}>{users.length}</div>
        </div>
        <div style={{ ...styles.card, borderTop: '4px solid #00C49A' }}>
          <div style={styles.cardLabel}>ACTIVE USERS</div>
          <div style={{ ...styles.cardValue, color: '#00C49A' }}>{activeUsers}</div>
        </div>
        <div style={{ ...styles.card, borderTop: '4px solid #F8E16C' }}>
          <div style={styles.cardLabel}>PENDING USERS</div>
          <div style={{ ...styles.cardValue, color: '#d97706' }}>{pendingUsers}</div>
        </div>
        <div style={{ ...styles.card, borderTop: '4px solid #ef4444' }}>
          <div style={styles.cardLabel}>REJECTED USERS</div>
          <div style={{ ...styles.cardValue, color: '#ef4444' }}>{rejectedUsers}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>TOTAL OPERATIONS</div>
          <div style={styles.cardValue}>{operations.length}</div>
        </div>
        <div style={{ ...styles.card, borderTop: '4px solid #00C49A' }}>
          <div style={styles.cardLabel}>TOTAL INCOME</div>
          <div style={{ ...styles.cardValue, color: '#00C49A' }}>{totalIncome.toFixed(2)} €</div>
        </div>
        <div style={{ ...styles.card, borderTop: '4px solid #ef4444' }}>
          <div style={styles.cardLabel}>TOTAL EXPENSES</div>
          <div style={{ ...styles.cardValue, color: '#ef4444' }}>{totalExpenses.toFixed(2)} €</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>GLOBAL BALANCE</div>
          <div style={{
            ...styles.cardValue,
            color: (totalIncome - totalExpenses) >= 0 ? '#00C49A' : '#ef4444'
          }}>
            {(totalIncome - totalExpenses).toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Recent users */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent registrations</h2>
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <span style={styles.col}>NAME</span>
            <span style={styles.col}>EMAIL</span>
            <span style={styles.col}>ROLE</span>
            <span style={styles.col}>STATUS</span>
          </div>
          {users.slice(0, 5).map(user => (
            <div key={user.id} style={styles.tableRow}>
              <span style={styles.col}>{user.firstName} {user.lastName}</span>
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
            </div>
          ))}
        </div>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    borderTop: '4px solid #e5e9e8',
  },
  cardLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '16px',
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr 1fr 1fr',
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
    gridTemplateColumns: '1fr 1.5fr 1fr 1fr',
    padding: '12px 0',
    borderBottom: '1px solid #f9fafb',
    alignItems: 'center',
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
};