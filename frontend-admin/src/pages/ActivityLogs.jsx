import { useState, useEffect } from 'react';
import { getActivityLogs } from '../services/adminService';

const ACTION_CONFIG = {
  login:              { label: 'Login',             color: '#2563EB', bg: 'rgba(37,99,235,0.1)',   icon: '🔐' },
  operation_created:  { label: 'Operation created', color: '#16A34A', bg: 'rgba(22,163,74,0.1)',   icon: '➕' },
  operation_updated:  { label: 'Operation updated', color: '#D97706', bg: 'rgba(217,119,6,0.1)',   icon: '✏️' },
  operation_deleted:  { label: 'Operation deleted', color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   icon: '🗑️' },
  profile_updated:    { label: 'Profile updated',   color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', icon: '👤' },
};

function relativeTime(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const ACTION_TYPES = ['all', 'login', 'operation_created', 'operation_updated', 'operation_deleted', 'profile_updated'];

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    try {
      const data = await getActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = logs.filter(log => {
    const matchAction = actionFilter === 'all' || log.actionType === actionFilter;
    const matchSearch = log.userEmail.toLowerCase().includes(search.toLowerCase());
    return matchAction && matchSearch;
  });

  const counts = ACTION_TYPES.slice(1).reduce((acc, t) => {
    acc[t] = logs.filter(l => l.actionType === t).length;
    return acc;
  }, {});

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Activity Logs</h1>
          <p style={s.subtitle}>{logs.length} events recorded in MongoDB</p>
        </div>
        <button style={s.btnRefresh} onClick={fetchLogs}>↻ Refresh</button>
      </div>

      {/* Stats row */}
      <div style={s.statsRow}>
        {ACTION_TYPES.slice(1).map(t => {
          const cfg = ACTION_CONFIG[t];
          return (
            <div key={t} style={{ ...s.statCard, borderTop: `3px solid ${cfg.color}` }}>
              <div style={s.statIcon}>{cfg.icon}</div>
              <div style={s.statCount}>{counts[t] ?? 0}</div>
              <div style={s.statLabel}>{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={s.toolbar}>
        <input
          type="text"
          placeholder="🔍  Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={s.searchInput}
        />
        <div style={s.filterGroup}>
          {ACTION_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setActionFilter(t)}
              style={{ ...s.filterBtn, ...(actionFilter === t ? s.filterBtnActive : {}) }}
            >
              {t === 'all' ? 'All' : (ACTION_CONFIG[t]?.icon + ' ' + ACTION_CONFIG[t]?.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={s.card}>
        <div style={s.tableHead}>
          <span style={s.th}>User</span>
          <span style={s.th}>Action</span>
          <span style={s.th}>Details</span>
          <span style={{ ...s.th, textAlign: 'right' }}>Time</span>
        </div>

        {filtered.length === 0 ? (
          <div style={s.empty}>No logs found</div>
        ) : (
          filtered.map(log => {
            const cfg = ACTION_CONFIG[log.actionType] || ACTION_CONFIG.login;
            return (
              <div key={log.id} style={s.row}>
                <div style={s.userCell}>
                  <div style={s.avatar}>{log.userEmail[0]?.toUpperCase()}</div>
                  <span style={s.email}>{log.userEmail}</span>
                </div>
                <div>
                  <span style={{ ...s.badge, backgroundColor: cfg.bg, color: cfg.color }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div style={s.details}>
                  {Object.entries(log.details || {}).map(([k, v]) => (
                    <span key={k} style={s.detailChip}>
                      <span style={s.detailKey}>{k}</span> {String(v).substring(0, 40)}
                    </span>
                  ))}
                </div>
                <span style={{ ...s.time, textAlign: 'right' }}>{relativeTime(log.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const s = {
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '200px', color: 'var(--color-text-light)', fontFamily: 'Montserrat, sans-serif',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px',
    color: 'var(--color-text)', fontFamily: 'Montserrat, sans-serif', marginBottom: '4px',
  },
  subtitle: { fontSize: '13px', color: 'var(--color-text-light)', fontWeight: '500', fontFamily: 'Montserrat, sans-serif' },
  btnRefresh: {
    backgroundColor: 'var(--color-white)', border: '1.5px solid var(--color-border)',
    borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: '700',
    fontFamily: 'Montserrat, sans-serif', cursor: 'pointer', color: 'var(--color-text)',
  },

  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px',
  },
  statCard: {
    backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '16px', fontFamily: 'Montserrat, sans-serif',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  statIcon: { fontSize: '20px' },
  statCount: { fontSize: '24px', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.5px' },
  statLabel: { fontSize: '11px', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' },

  toolbar: { display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' },
  searchInput: {
    flex: 1, minWidth: '200px', padding: '10px 14px',
    border: '1.5px solid var(--color-border)', borderRadius: '10px',
    fontSize: '13px', fontFamily: 'Montserrat, sans-serif',
    backgroundColor: 'var(--color-white)', color: 'var(--color-text)', outline: 'none',
  },
  filterGroup: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  filterBtn: {
    padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--color-border)',
    fontSize: '12px', fontWeight: '600', fontFamily: 'Montserrat, sans-serif',
    cursor: 'pointer', backgroundColor: 'var(--color-white)', color: 'var(--color-text-light)',
    whiteSpace: 'nowrap',
  },
  filterBtnActive: {
    backgroundColor: '#2563EB', color: '#fff', borderColor: '#2563EB',
  },

  card: {
    backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)',
    borderRadius: '16px', overflow: 'hidden',
  },
  tableHead: {
    display: 'grid', gridTemplateColumns: '2fr 1.5fr 2.5fr 1fr',
    padding: '12px 20px', backgroundColor: 'var(--color-bg)',
    borderBottom: '1px solid var(--color-border)',
    fontFamily: 'Montserrat, sans-serif',
  },
  th: { fontSize: '11px', fontWeight: '700', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  row: {
    display: 'grid', gridTemplateColumns: '2fr 1.5fr 2.5fr 1fr',
    padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
    alignItems: 'center', fontFamily: 'Montserrat, sans-serif',
    transition: 'background 0.1s',
  },
  userCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF',
    color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '800', flexShrink: 0,
  },
  email: { fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
    fontFamily: 'Montserrat, sans-serif',
  },
  details: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  detailChip: {
    backgroundColor: 'var(--color-bg)', borderRadius: '6px', padding: '3px 7px',
    fontSize: '11px', fontWeight: '500', color: 'var(--color-text-light)',
  },
  detailKey: { fontWeight: '700', color: 'var(--color-text)' },
  time: { fontSize: '12px', color: 'var(--color-text-light)', fontWeight: '600' },
  empty: {
    textAlign: 'center', padding: '48px', color: 'var(--color-text-light)',
    fontSize: '14px', fontWeight: '500', fontFamily: 'Montserrat, sans-serif',
  },
};
