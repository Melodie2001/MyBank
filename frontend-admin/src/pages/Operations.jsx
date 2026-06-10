import { useState, useEffect } from 'react';
import { getAllOperations } from '../services/adminService';

export default function Operations() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchOps() {
      try {
        const data = await getAllOperations();
        setOperations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOps();
  }, []);

  const filtered = operations.filter(op => {
    const matchFilter = filter === 'all' || op.type === filter;
    const matchSearch =
      op.label.toLowerCase().includes(search.toLowerCase()) ||
      op.user.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalIncome = operations
    .filter(op => op.type === 'income')
    .reduce((sum, op) => sum + Number(op.amount), 0);

  const totalExpenses = operations
    .filter(op => op.type === 'expense')
    .reduce((sum, op) => sum + Number(op.amount), 0);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>All operations</h1>
          <p style={styles.subtitle}>{operations.length} operations total</p>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>TOTAL OPERATIONS</div>
          <div style={styles.statValue}>{operations.length}</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: '4px solid #00C49A' }}>
          <div style={styles.statLabel}>TOTAL INCOME</div>
          <div style={{ ...styles.statValue, color: '#00C49A' }}>{totalIncome.toFixed(2)} €</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: '4px solid #ef4444' }}>
          <div style={styles.statLabel}>TOTAL EXPENSES</div>
          <div style={{ ...styles.statValue, color: '#ef4444' }}>{totalExpenses.toFixed(2)} €</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <div style={styles.filters}>
            {['all', 'income', 'expense'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...styles.filterBtn,
                  ...(filter === f ? styles.filterBtnActive : {})
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
              placeholder="Search by label or user email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={styles.tableHeader}>
          <span style={styles.col}>DESCRIPTION</span>
          <span style={styles.col}>USER</span>
          <span style={styles.col}>CATEGORY</span>
          <span style={styles.col}>DATE</span>
          <span style={styles.col}>AMOUNT</span>
        </div>

        {filtered.length === 0 ? (
          <div style={styles.empty}>No operations found</div>
        ) : (
          filtered.map(op => (
            <div key={op.id} style={styles.tableRow}>
              <span style={{ ...styles.col, fontSize: '13px', fontWeight: '500' }}>{op.label}</span>
              <span style={{ ...styles.col, fontSize: '12px' }}>{op.user.email}</span>
              <span style={styles.col}>
                <span style={{
                  ...styles.categoryBadge,
                  backgroundColor: op.category.color + '22',
                  color: op.category.color
                }}>
                  {op.category.name}
                </span>
              </span>
              <span style={{ ...styles.col, fontSize: '13px' }}>{op.date}</span>
              <span style={{
                ...styles.col,
                fontWeight: '700',
                fontSize: '13px',
                color: op.type === 'income' ? '#00C49A' : '#ef4444'
              }}>
                {op.type === 'income' ? '+' : '-'}{Number(op.amount).toFixed(2)} €
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
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    borderTop: '4px solid #e5e9e8',
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
    gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
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
    gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
    padding: '12px 0',
    borderBottom: '1px solid #f9fafb',
    alignItems: 'center',
  },
  categoryBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    padding: '40px 0',
  },
};