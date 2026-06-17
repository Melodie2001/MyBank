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
        <div style={{ ...styles.statCard, borderTop: '3px solid #16A34A' }}>
          <div style={styles.statLabel}>TOTAL INCOME</div>
          <div style={{ ...styles.statValue, color: '#16A34A' }}>{totalIncome.toFixed(2)} €</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: '3px solid #DC2626' }}>
          <div style={styles.statLabel}>TOTAL EXPENSES</div>
          <div style={{ ...styles.statValue, color: '#DC2626' }}>{totalExpenses.toFixed(2)} €</div>
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
          <span style={{ ...styles.col, textAlign: 'right' }}>AMOUNT</span>
        </div>

        {filtered.length === 0 ? (
          <div style={styles.empty}>No operations found</div>
        ) : (
          filtered.map(op => (
            <div key={op.id} style={styles.tableRow}>
              <span style={styles.opLabel}>{op.label}</span>
              <span style={styles.opUser}>{op.user.email}</span>
              <span>
                <span style={{
                  ...styles.categoryBadge,
                  backgroundColor: op.category.color + '22',
                  color: op.category.color
                }}>
                  {op.category.name}
                </span>
              </span>
              <span style={styles.opDate}>{op.date}</span>
              <span style={{
                ...styles.opAmount,
                color: op.type === 'income' ? '#16A34A' : '#DC2626'
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
    color: 'var(--color-text-light)',
    fontFamily: 'Montserrat, sans-serif',
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
    fontFamily: 'Montserrat, sans-serif',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    fontFamily: 'Montserrat, sans-serif',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '16px',
  },
  statCard: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '20px 22px',
    borderTop: '3px solid #2563EB',
    fontFamily: 'Montserrat, sans-serif',
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
  },
  card: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '24px',
    fontFamily: 'Montserrat, sans-serif',
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
    fontFamily: 'Montserrat, sans-serif',
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
    fontFamily: 'Montserrat, sans-serif',
    color: 'var(--color-text)',
    flex: 1,
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
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
    gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
    padding: '13px 0',
    borderBottom: '1px solid var(--color-bg-soft)',
    alignItems: 'center',
  },
  opLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  opUser: {
    fontSize: '12px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
  },
  opDate: {
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
  },
  categoryBadge: {
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '700',
  },
  opAmount: {
    fontWeight: '800',
    fontSize: '14px',
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--color-text-light)',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'Montserrat, sans-serif',
    padding: '40px 0',
  },
};