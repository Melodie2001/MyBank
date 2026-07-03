import { useState, useEffect } from 'react';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notificationService';

const TYPE_CONFIG = {
  operation_added:   { icon: '💰', color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  budget_warning:    { icon: '⚠️', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  budget_exceeded:   { icon: '🚨', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  account_validated: { icon: '✅', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
};

function relativeTime(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function groupByDate(notifications) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups = { Today: [], Yesterday: [], Earlier: [] };

  for (const n of notifications) {
    const d = new Date(n.createdAt).toDateString();
    if (d === today) groups.Today.push(n);
    else if (d === yesterday) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  }

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRead(id) {
    const n = notifications.find(x => x.id === id);
    if (n?.isRead) return;
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(x => x.id === id ? { ...x, isRead: true } : x));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleReadAll() {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(x => ({ ...x, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(x => x.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const groups = groupByDate(notifications);

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Notifications</h1>
          <p style={s.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button style={s.btnReadAll} onClick={handleReadAll}>
            ✓ Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🔔</div>
          <div style={s.emptyTitle}>No notifications yet</div>
          <div style={s.emptyText}>Budget alerts and account events will appear here.</div>
        </div>
      ) : (
        <div style={s.list}>
          {groups.map(([label, items]) => (
            <div key={label}>
              <div style={s.groupLabel}>{label}</div>
              {items.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.operation_added;
                return (
                  <div
                    key={n.id}
                    style={{ ...s.card, ...(n.isRead ? s.cardRead : s.cardUnread) }}
                    onClick={() => handleRead(n.id)}
                  >
                    <div style={{ ...s.iconBox, backgroundColor: cfg.bg }}>
                      <span style={s.iconEmoji}>{cfg.icon}</span>
                    </div>

                    <div style={s.content}>
                      <div style={s.cardHeader}>
                        <span style={{ ...s.cardTitle, color: n.isRead ? 'var(--color-text)' : 'var(--color-text)' }}>
                          {n.title}
                        </span>
                        <div style={s.metaRight}>
                          <span style={s.time}>{relativeTime(n.createdAt)}</span>
                          {!n.isRead && <span style={s.unreadDot} />}
                        </div>
                      </div>
                      <p style={s.message}>{n.message}</p>
                    </div>

                    <button
                      style={s.deleteBtn}
                      onClick={(e) => handleDelete(n.id, e)}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '200px', fontSize: '16px', color: 'var(--color-text-light)',
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px',
    color: 'var(--color-text)', fontFamily: 'Inter, sans-serif', marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px', color: 'var(--color-text-light)', fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
  },
  btnReadAll: {
    backgroundColor: 'var(--color-white)', color: '#2563EB',
    border: '1.5px solid #2563EB', borderRadius: '12px',
    padding: '9px 18px', fontWeight: '700', fontSize: '13px',
    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '4px' },
  groupLabel: {
    fontSize: '11px', fontWeight: '700', color: 'var(--color-text-light)',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    fontFamily: 'Inter, sans-serif',
    padding: '16px 0 8px',
  },
  card: {
    display: 'flex', alignItems: 'flex-start', gap: '14px',
    padding: '16px 18px', borderRadius: '14px',
    border: '1px solid var(--color-border)', cursor: 'pointer',
    transition: 'background 0.12s',
    position: 'relative', fontFamily: 'Inter, sans-serif',
    backgroundColor: 'var(--color-white)',
  },
  cardUnread: { borderLeftWidth: '3px', borderLeftColor: '#2563EB' },
  cardRead: { opacity: 0.75 },
  iconBox: {
    width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  iconEmoji: { fontSize: '20px', lineHeight: 1 },
  content: { flex: 1, minWidth: 0 },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '4px', gap: '12px',
  },
  cardTitle: {
    fontSize: '14px', fontWeight: '700', color: 'var(--color-text)',
  },
  metaRight: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  time: { fontSize: '11px', color: 'var(--color-text-light)', fontWeight: '600' },
  unreadDot: {
    width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB', flexShrink: 0,
  },
  message: {
    fontSize: '13px', color: 'var(--color-text-light)', fontWeight: '500',
    lineHeight: '1.5', margin: 0,
  },
  deleteBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-light)', fontSize: '18px', lineHeight: 1,
    padding: '0 4px', flexShrink: 0, opacity: 0.5,
    transition: 'opacity 0.12s',
    alignSelf: 'center',
  },
  empty: {
    textAlign: 'center', padding: '80px 40px',
    backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)',
    borderRadius: '16px', fontFamily: 'Inter, sans-serif',
  },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyTitle: {
    fontSize: '18px', fontWeight: '800', color: 'var(--color-text)', marginBottom: '8px',
  },
  emptyText: { fontSize: '14px', color: 'var(--color-text-light)', fontWeight: '500' },
};
