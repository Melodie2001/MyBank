import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { getDashboard } from '../services/operationService';
import { getMyCategories } from '../services/categoryService';
import { getBalanceHistory } from '../services/analyticsService';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';

const CHART_COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0EA5E9'];

function getCategoryEmoji(categoryName) {
  const n = (categoryName || '').toLowerCase();
  if (n.includes('work') || n.includes('salary') || n.includes('emploi')) return '💼';
  if (n.includes('food') || n.includes('eat') || n.includes('nourriture') || n.includes('repas')) return '🍔';
  if (n.includes('coffee') || n.includes('café') || n.includes('cafe')) return '☕';
  if (n.includes('shop') || n.includes('achat') || n.includes('cloth') || n.includes('mode')) return '🛍️';
  if (n.includes('travel') || n.includes('voyage') || n.includes('vacation') || n.includes('trip')) return '✈️';
  if (n.includes('transport') || n.includes('voiture') || n.includes('car') || n.includes('taxi')) return '🚗';
  if (n.includes('health') || n.includes('santé') || n.includes('doctor') || n.includes('médecin')) return '💊';
  if (n.includes('sport') || n.includes('gym') || n.includes('fitness')) return '🏃';
  if (n.includes('entertain') || n.includes('cinema') || n.includes('film') || n.includes('movie')) return '🎬';
  if (n.includes('home') || n.includes('loyer') || n.includes('rent') || n.includes('maison')) return '🏠';
  if (n.includes('education') || n.includes('school') || n.includes('livre') || n.includes('book')) return '📚';
  if (n.includes('tech') || n.includes('computer') || n.includes('phone') || n.includes('ordi')) return '💻';
  if (n.includes('sub') || n.includes('abonn') || n.includes('netflix') || n.includes('spotify')) return '📱';
  if (n.includes('income') || n.includes('revenu') || n.includes('salaire')) return '💰';
  if (n.includes('transfer') || n.includes('virement')) return '💸';
  return '💳';
}

export default function Dashboard() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboard, cats, history] = await Promise.all([
          getDashboard(),
          getMyCategories(),
          getBalanceHistory().catch(() => []),
        ]);
        setData(dashboard);
        setCategories(cats);
        setBalanceHistory(history);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const operations = data?.recent_operations || [];

  const filteredOperations = operations.filter(op => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'income' && op.type === 'income') ||
      (filter === 'expense' && op.type === 'expense');
    const matchSearch = op.label.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Budget breakdown: group expenses by category
  const budgetByCategory = operations
    .filter(op => op.type === 'expense')
    .reduce((acc, op) => {
      const name = op.category.name;
      const color = op.category.color;
      if (!acc[name]) acc[name] = { total: 0, color };
      acc[name].total += Number(op.amount);
      return acc;
    }, {});

  const totalExpenses = data?.expenses || 0;

  const donutData = Object.entries(budgetByCategory).map(([name, { total, color }]) => ({
    name,
    value: total,
    color: color || CHART_COLORS[0],
    pct: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0
  })).sort((a, b) => b.value - a.value);

  // Spending over time: always computed from operations for full historical coverage
  const chartData = (() => {
    if (operations.length === 0) return [];
    const dates = operations.map(op => op.date).sort();
    const daysDiff = (new Date(dates[dates.length - 1]) - new Date(dates[0])) / 86400000;
    const byDay = daysDiff <= 60;

    const grouped = operations.reduce((acc, op) => {
      const key = byDay ? op.date : op.date.slice(0, 7);
      if (!acc[key]) acc[key] = { income: 0, expense: 0 };
      if (op.type === 'income') acc[key].income += Number(op.amount);
      else acc[key].expense += Number(op.amount);
      return acc;
    }, {});

    return Object.keys(grouped).sort().map(key => ({
      label: byDay
        ? new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      expense: Number(grouped[key].expense.toFixed(2)),
      income: Number(grouped[key].income.toFixed(2)),
    }));
  })();

  // % vs last month
  const sortedMonths = [...new Set(operations.map(op => op.date.slice(0, 7)))].sort();
  const monthlyData = operations.reduce((acc, op) => {
    const month = op.date.slice(0, 7);
    if (!acc[month]) acc[month] = { income: 0, expense: 0 };
    if (op.type === 'income') acc[month].income += Number(op.amount);
    else acc[month].expense += Number(op.amount);
    return acc;
  }, {});

  let expenseChangePct = null;
  if (sortedMonths.length >= 2) {
    const last = monthlyData[sortedMonths[sortedMonths.length - 1]].expense;
    const prev = monthlyData[sortedMonths[sortedMonths.length - 2]].expense;
    if (prev > 0) expenseChangePct = Math.round(((last - prev) / prev) * 100);
  }

  let incomeChangePct = null;
  if (sortedMonths.length >= 2) {
    const last = monthlyData[sortedMonths[sortedMonths.length - 1]].income;
    const prev = monthlyData[sortedMonths[sortedMonths.length - 2]].income;
    if (prev > 0) incomeChangePct = Math.round(((last - prev) / prev) * 100);
  }

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Good morning 👋</h1>
          <p style={styles.subtitle}>Here's what's happening with your account today.</p>
        </div>
        <Link to="/operations" state={{ openModal: true }}>
          <button style={styles.btnAdd}>+ Add operation</button>
        </Link>
      </div>

      {/* Stats cards */}
      <div style={{ ...styles.statsRow, ...(isMobile ? { gridTemplateColumns: '1fr' } : {}) }}>
        <div style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>Total Balance</span>
            <div style={{ ...styles.statIcon, backgroundColor: 'var(--color-bg-soft)', color: '#2563EB' }}>👛</div>
          </div>
          <div style={styles.statValue}>
            {Number(data?.balance || 0).toFixed(2)} €
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>Total Income</span>
            <div style={{ ...styles.statIcon, backgroundColor: '#ECFDF5', color: '#16A34A' }}>⬇</div>
          </div>
          <div style={{ ...styles.statValue, color: '#16A34A' }}>
            {Number(data?.income || 0).toFixed(2)} €
          </div>
          {incomeChangePct !== null && (
            <div style={{ ...styles.statChange, color: incomeChangePct >= 0 ? '#16A34A' : '#DC2626' }}>
              {incomeChangePct >= 0 ? '▲' : '▼'} {Math.abs(incomeChangePct)}%
              <span style={styles.statChangeLabel}>vs last month</span>
            </div>
          )}
        </div>

        <div style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>Total Expenses</span>
            <div style={{ ...styles.statIcon, backgroundColor: '#FEF2F2', color: '#DC2626' }}>⬆</div>
          </div>
          <div style={{ ...styles.statValue, color: '#DC2626' }}>
            {Number(data?.expenses || 0).toFixed(2)} €
          </div>
          {expenseChangePct !== null && (
            <div style={{ ...styles.statChange, color: expenseChangePct <= 0 ? '#16A34A' : '#DC2626' }}>
              {expenseChangePct >= 0 ? '▲' : '▼'} {Math.abs(expenseChangePct)}%
              <span style={styles.statChangeLabel}>vs last month</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...styles.mainGrid, ...(isMobile ? { gridTemplateColumns: '1fr' } : {}) }}>
        {/* Left: Recent operations */}
        <div style={styles.leftCol}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Recent operations</span>
              <Link to="/operations" style={styles.seeAll}>View all →</Link>
            </div>

            {/* Search + Filters row */}
            <div style={{ ...styles.searchRow, ...(isMobile ? { flexWrap: 'wrap', gap: '8px' } : {}) }}>
              <div style={styles.searchBar}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-light)', flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search operations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={styles.searchInput}
                />
                <span style={styles.searchKbd}>⌘K</span>
              </div>
              <div style={styles.filters}>
                {['All', 'Income', 'Expense'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f.toLowerCase())}
                    style={{
                      ...styles.filterBtn,
                      ...(filter === f.toLowerCase() ? styles.filterBtnActive : {})
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {!isMobile && <div style={styles.tableHeader}>
              <span style={{ ...styles.col, gridColumn: 'span 2' }}>DESCRIPTION</span>
              <span style={styles.col}>CATEGORY</span>
              <span style={styles.col}>DATE</span>
              <span style={{ ...styles.col, textAlign: 'right' }}>AMOUNT</span>
            </div>}

            {filteredOperations.length === 0 ? (
              <div style={styles.empty}>No operations found</div>
            ) : (
              filteredOperations.slice(0, 8).map(op => (
                <div key={op.id} style={{ ...styles.tableRow, gridTemplateColumns: isMobile ? '36px 1fr auto' : '36px 2fr 1fr 1fr 1fr' }}>
                  {/* Icon */}
                  <div style={{
                    ...styles.opIcon,
                    backgroundColor: op.category.color + '22',
                  }}>
                    {getCategoryEmoji(op.category.name)}
                  </div>
                  {/* Label + category subtitle */}
                  <div style={styles.opInfo}>
                    <span style={styles.opLabel}>{op.label}</span>
                    <span style={styles.opSub}>{op.category.name}</span>
                  </div>
                  <span style={{ ...styles.col, ...(isMobile ? { display: 'none' } : {}) }}>
                    <span style={{
                      ...styles.categoryBadge,
                      backgroundColor: op.category.color + '22',
                      color: op.category.color
                    }}>
                      {op.category.name}
                    </span>
                  </span>
                  <span style={{ ...styles.col, color: 'var(--color-text-light)', ...(isMobile ? { display: 'none' } : {}) }}>{op.date}</span>
                  <span style={{
                    ...styles.col,
                    fontWeight: '800',
                    textAlign: 'right',
                    color: op.type === 'income' ? '#16A34A' : '#DC2626'
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

          {/* Donut chart */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Budget breakdown</div>
            {donutData.length === 0 ? (
              <div style={styles.empty}>No expenses yet</div>
            ) : (
              <div style={styles.donutRow}>
                <div style={styles.donutWrap}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={64}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={styles.donutCenter}>
                    <span style={styles.donutAmount}>{totalExpenses.toFixed(2)} €</span>
                    <span style={styles.donutLabel}>Spent</span>
                  </div>
                </div>

                <div style={styles.donutLegend}>
                  {donutData.map((entry, index) => (
                    <div key={entry.name} style={styles.legendRow}>
                      <div style={{ ...styles.legendDot, backgroundColor: entry.color || CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span style={styles.legendName}>{entry.name}</span>
                      <span style={styles.legendAmount}>{entry.value.toFixed(2)} €</span>
                      <span style={styles.legendPct}>{entry.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Categories list */}
          <div style={{ ...styles.card, marginTop: '16px' }}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Categories</span>
              <Link to="/categories" style={styles.seeAll}>Manage</Link>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {categories.slice(0, 5).map(cat => {
                const catTotal = budgetByCategory[cat.name]?.total || 0;
                const pct = totalExpenses > 0 ? Math.round((catTotal / totalExpenses) * 100) : 0;
                return (
                  <div key={cat.id} style={styles.categoryRow}>
                    <div style={{ ...styles.catDot, backgroundColor: cat.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.catTop}>
                        <span style={styles.catName}>{cat.name}</span>
                        <span style={styles.catAmount}>{catTotal.toFixed(2)} €</span>
                      </div>
                      <div style={styles.progressBg}>
                        <div style={{ ...styles.progressBar, width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                    <span style={styles.catPct}>{pct}%</span>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <div style={styles.empty}>No categories yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spending over time */}
      {chartData.length > 0 && (
        <div style={{ ...styles.card, marginTop: '16px' }}>
          <div style={styles.cardTitle}>Spending over time</div>
          <div style={{ marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={dark ? '#334155' : '#F1F5F9'} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#94A3B8', fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94A3B8', fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v} €`}
                />
                <Tooltip
                  formatter={(value, name) => [`${value.toFixed(2)} €`, name === 'expense' ? 'Expenses' : 'Income']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`,
                    backgroundColor: dark ? '#1E293B' : '#fff',
                    color: dark ? '#F1F5F9' : '#0B1E3D',
                    fontFamily: 'Inter',
                    fontSize: '13px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fill="url(#colorIncome)"
                  dot={{ r: 3, fill: '#16A34A', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#colorExpense)"
                  dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
    marginTop: '4px',
  },
  btnAdd: {
    backgroundColor: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 22px',
    fontWeight: '700',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    boxShadow: '0 10px 24px -8px rgba(37,99,235,0.4)',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '17px',
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text-light)',
    fontFamily: 'Inter, sans-serif',
  },
  statValue: {
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
    fontFamily: 'Inter, sans-serif',
  },
  statChange: {
    fontSize: '12px',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statChangeLabel: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '600',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '16px',
  },
  leftCol: {},
  rightCol: {},
  card: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '24px',
    fontFamily: 'Inter, sans-serif',
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
    fontWeight: '800',
    color: 'var(--color-text)',
    marginRight: 'auto',
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
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
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
  seeAll: {
    fontSize: '12px',
    color: '#2563EB',
    fontWeight: '700',
    textDecoration: 'none',
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--color-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: '9px 14px',
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
  searchKbd: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--color-text-light)',
    backgroundColor: 'var(--color-border)',
    padding: '2px 6px',
    borderRadius: '5px',
    letterSpacing: '0.03em',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '36px 2fr 1fr 1fr 1fr',
    padding: '10px 0',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '4px',
  },
  col: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '700',
    letterSpacing: '0.05em',
    fontFamily: 'Inter, sans-serif',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '36px 2fr 1fr 1fr 1fr',
    padding: '11px 0',
    borderBottom: '1px solid var(--color-bg-soft)',
    alignItems: 'center',
    gap: '4px',
  },
  opIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    flexShrink: 0,
  },
  opInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingLeft: '10px',
  },
  opLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'Inter, sans-serif',
  },
  opSub: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
  },
  categoryBadge: {
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--color-text-light)',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    padding: '24px 0',
  },
  donutRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  donutWrap: {
    position: 'relative',
    width: '140px',
    height: '140px',
    flexShrink: 0,
  },
  donutCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  donutAmount: {
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
  },
  donutLabel: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '600',
  },
  donutLegend: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendName: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text)',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  legendAmount: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--color-text)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  legendPct: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--color-text-light)',
    width: '28px',
    textAlign: 'right',
    flexShrink: 0,
  },
  categoryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  catDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  catTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '6px',
  },
  catName: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  catAmount: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  catPct: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '700',
    width: '32px',
    textAlign: 'right',
  },
  progressBg: {
    height: '6px',
    borderRadius: '999px',
    backgroundColor: 'var(--color-bg-soft)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.3s',
  },
};