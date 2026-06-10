import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/operationService';
import { getMyCategories } from '../services/categoryService';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboard, cats] = await Promise.all([
          getDashboard(),
          getMyCategories()
        ]);
        setData(dashboard);
        setCategories(cats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredOperations = (data?.recent_operations || []).filter(op => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'income' && op.type === 'income') ||
      (filter === 'expense' && op.type === 'expense');
    const matchSearch = op.label.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const budgetByCategory = (data?.recent_operations || [])
    .filter(op => op.type === 'expense')
    .reduce((acc, op) => {
      const name = op.category.name;
      const color = op.category.color;
      if (!acc[name]) acc[name] = { total: 0, color };
      acc[name].total += op.amount;
      return acc;
    }, {});

  const totalExpenses = data?.expenses || 1;

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <div />
        <Link to="/operations" state={{ openModal: true }}>
     <button style={styles.btnAdd}>+ Add operation</button>
        </Link>
      </div>

      {/* Stats cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>BALANCE</div>
          <div style={styles.statValue}>
            {Number(data?.balance || 0).toFixed(2)} €
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>TOTAL INCOME</div>
          <div style={{ ...styles.statValue, color: '#00C49A' }}>
            {Number(data?.income || 0).toFixed(2)} €
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>TOTAL EXPENSES</div>
          <div style={{ ...styles.statValue, color: '#ef4444' }}>
            {Number(data?.expenses || 0).toFixed(2)} €
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* Left: Recent operations */}
        <div style={styles.leftCol}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Recent operations</span>
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
              <Link to="/operations" style={styles.seeAll}>See all</Link>
            </div>

            <div style={styles.searchBar}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search operations"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.tableHeader}>
              <span style={styles.col}>DESCRIPTION</span>
              <span style={styles.col}>CATEGORY</span>
              <span style={styles.col}>DATE</span>
              <span style={styles.col}>AMOUNT</span>
            </div>

            {filteredOperations.length === 0 ? (
              <div style={styles.empty}>No operations found</div>
            ) : (
              filteredOperations.slice(0, 8).map(op => (
                <div key={op.id} style={styles.tableRow}>
                  <span style={styles.col}>{op.label}</span>
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
        </div>

        {/* Right: Budget breakdown + Categories */}
        <div style={styles.rightCol}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Budget breakdown</div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(budgetByCategory).map(([name, { total, color }]) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>{name}</span>
                    <span>{Number(total).toFixed(2)} €</span>
                  </div>
                  <div style={styles.progressBg}>
                    <div style={{
                      ...styles.progressBar,
                      width: `${Math.min((total / totalExpenses) * 100, 100)}%`,
                      backgroundColor: color
                    }} />
                  </div>
                </div>
              ))}
              {Object.keys(budgetByCategory).length === 0 && (
                <div style={styles.empty}>No expenses yet</div>
              )}
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: '16px' }}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Categories</span>
              <Link to="/categories" style={styles.seeAll}>Manage</Link>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.slice(0, 5).map(cat => (
                <div key={cat.id} style={styles.catRow}>
                  <div style={{
                    ...styles.catDot,
                    backgroundColor: cat.color
                  }} />
                  <span style={{ fontSize: '13px' }}>{cat.name}</span>
                </div>
              ))}
              {categories.length === 0 && (
                <div style={styles.empty}>No categories yet</div>
              )}
            </div>
          </div>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  btnAdd: {
    backgroundColor: '#00C49A',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
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
  },
  statLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '16px',
  },
  leftCol: {},
  rightCol: {},
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    marginRight: 'auto',
  },
  filters: {
    display: 'flex',
    gap: '6px',
  },
  filterBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#00C49A',
    color: '#fff',
  },
  seeAll: {
    fontSize: '12px',
    color: '#00C49A',
    fontWeight: '600',
    textDecoration: 'none',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '8px 12px',
    marginBottom: '16px',
  },
  searchIcon: {
    fontSize: '14px',
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
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
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
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: '10px 0',
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
    padding: '24px 0',
  },
  progressBg: {
    height: '6px',
    backgroundColor: '#f3f4f6',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s',
  },
  catRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  catDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
};