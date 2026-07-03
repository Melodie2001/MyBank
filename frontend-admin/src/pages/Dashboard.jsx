import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { getUsers, getAllOperations } from '../services/adminService';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const { dark } = useTheme();
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

  const adminCount = users.filter(u => u.roles.includes('ROLE_ADMIN')).length;
  const userCount = users.length - adminCount;

  const donutData = [
    { name: 'Users', value: userCount, color: '#2563EB' },
    { name: 'Admins', value: adminCount, color: '#0B1E3D' },
  ].filter(d => d.value > 0);

  // Group operations by month for the financial chart
  const monthlyData = operations.reduce((acc, op) => {
    const month = op.date.slice(0, 7); // "YYYY-MM"
    if (!acc[month]) acc[month] = { month, income: 0, expense: 0 };
    if (op.type === 'income') {
      acc[month].income += Number(op.amount);
    } else {
      acc[month].expense += Number(op.amount);
    }
    return acc;
  }, {});

  const sortedMonths = Object.keys(monthlyData).sort();
  const chartData = sortedMonths.map(month => {
    const [year, m] = month.split('-');
    const label = new Date(year, m - 1).toLocaleDateString('en-US', { month: 'short' });
    return {
      label,
      income: Number(monthlyData[month].income.toFixed(2)),
      expense: Number(monthlyData[month].expense.toFixed(2)),
    };
  });

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Overview of the Nexo Finance platform</p>
      </div>

      {/* User KPI cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Total users</div>
          <div style={styles.kpiValue}>{users.length}</div>
        </div>
        <div style={{ ...styles.kpiCard, borderTop: '3px solid #16A34A' }}>
          <div style={styles.kpiLabel}>Active users</div>
          <div style={{ ...styles.kpiValue, color: '#16A34A' }}>{activeUsers}</div>
        </div>
        <div style={{ ...styles.kpiCard, borderTop: '3px solid #D97706' }}>
          <div style={styles.kpiLabel}>Pending users</div>
          <div style={{ ...styles.kpiValue, color: '#D97706' }}>{pendingUsers}</div>
        </div>
        <div style={{ ...styles.kpiCard, borderTop: '3px solid #DC2626' }}>
          <div style={styles.kpiLabel}>Rejected users</div>
          <div style={{ ...styles.kpiValue, color: '#DC2626' }}>{rejectedUsers}</div>
        </div>
      </div>

      {/* Main grid: financial overview + donut */}
      <div style={styles.mainGrid}>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Financial overview</span>
          </div>

          <div style={styles.financialStats}>
            <div>
              <div style={styles.financialLabel}>Total income</div>
              <div style={{ ...styles.financialValue, color: '#16A34A' }}>
                {totalIncome.toFixed(2)} €
              </div>
            </div>
            <div>
              <div style={styles.financialLabel}>Total expenses</div>
              <div style={{ ...styles.financialValue, color: '#DC2626' }}>
                {totalExpenses.toFixed(2)} €
              </div>
            </div>
            <div>
              <div style={styles.financialLabel}>Global balance</div>
              <div style={{
                ...styles.financialValue,
                color: (totalIncome - totalExpenses) >= 0 ? 'var(--color-text)' : '#DC2626'
              }}>
                {(totalIncome - totalExpenses).toFixed(2)} €
              </div>
            </div>
            <div>
              <div style={styles.financialLabel}>Total operations</div>
              <div style={styles.financialValue}>{operations.length}</div>
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
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
                  formatter={(value, name) => [`${value.toFixed(2)} €`, name === 'income' ? 'Income' : 'Expenses']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`,
                    backgroundColor: dark ? '#1E293B' : '#fff',
                    color: dark ? '#F1F5F9' : '#0B1E3D',
                    fontFamily: 'Inter',
                    fontSize: '13px',
                  }}
                />
                <Legend
                  formatter={(value) => value === 'income' ? 'Income' : 'Expenses'}
                  wrapperStyle={{ fontSize: '12px', fontFamily: 'Inter', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="income" stroke="#16A34A" strokeWidth={3} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#DC2626" strokeWidth={3} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.empty}>No operations yet</div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>User distribution</span>
          </div>

          {donutData.length === 0 ? (
            <div style={styles.empty}>No users yet</div>
          ) : (
            <div style={styles.donutRow}>
              <div style={styles.donutWrap}>
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={68}
                      paddingAngle={2}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={styles.donutCenter}>
                  <span style={styles.donutAmount}>{users.length}</span>
                  <span style={styles.donutLabel}>Total</span>
                </div>
              </div>

              <div style={styles.donutLegend}>
                {donutData.map(entry => {
                  const pct = users.length > 0 ? Math.round((entry.value / users.length) * 100) : 0;
                  return (
                    <div key={entry.name} style={styles.legendRow}>
                      <div style={{ ...styles.legendDot, backgroundColor: entry.color }} />
                      <span style={styles.legendName}>{entry.name}</span>
                      <span style={styles.legendValue}>{entry.value}</span>
                      <span style={styles.legendPct}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent users */}
      <div style={{ ...styles.card, marginTop: '16px' }}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>Recent registrations</span>
        </div>
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
                backgroundColor: user.roles.includes('ROLE_ADMIN') ? '#0B1E3D' : 'var(--color-bg-soft)',
                color: user.roles.includes('ROLE_ADMIN') ? '#fff' : 'var(--color-text-light)',
              }}>
                {user.roles.includes('ROLE_ADMIN') ? 'Admin' : 'User'}
              </span>
            </span>
            <span style={styles.col}>
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
          </div>
        ))}
        {users.length === 0 && (
          <div style={styles.empty}>No users yet</div>
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
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '16px',
  },
  kpiCard: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '20px 22px',
    borderTop: '3px solid #2563EB',
    fontFamily: 'Inter, sans-serif',
  },
  kpiLabel: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '10px',
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '16px',
  },
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
    marginBottom: '18px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: 'var(--color-text)',
  },
  financialStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  financialLabel: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  financialValue: {
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--color-text-light)',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
    padding: '40px 0',
  },
  donutRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  donutWrap: {
    position: 'relative',
    width: '150px',
    height: '150px',
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
    fontSize: '24px',
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
    gap: '14px',
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
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
  },
  legendValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  legendPct: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--color-text-light)',
    width: '36px',
    textAlign: 'right',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr 1fr 1fr',
    padding: '0 0 10px',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '4px',
  },
  col: {
    fontSize: '12px',
    color: 'var(--color-text-light)',
    fontWeight: '700',
    letterSpacing: '0.04em',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr 1fr 1fr',
    padding: '12px 0',
    borderBottom: '1px solid var(--color-bg-soft)',
    alignItems: 'center',
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
};