import api from '../api/axios';

export const NOTIFICATIONS_CHANGED = 'notifications:changed';

export async function getNotifications() {
  const r = await api.get('/api/notifications');
  return r.data;
}

export async function getUnreadCount() {
  const r = await api.get('/api/notifications/unread-count');
  return r.data.count;
}

export async function markAsRead(id) {
  const r = await api.put(`/api/notifications/${id}/read`);
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
  return r.data;
}

export async function markAllAsRead() {
  const r = await api.put('/api/notifications/read-all');
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
  return r.data;
}

export async function deleteNotification(id) {
  const r = await api.delete(`/api/notifications/${id}`);
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
  return r.data;
}
