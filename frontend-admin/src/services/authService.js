import api from '../api/axios';

const userPortalUrl = import.meta.env.VITE_USER_URL || 'http://localhost:5173';

export async function login(email, password) {
  const response = await api.post('/api/login', { email, password });
  const { token, refresh_token: refreshToken } = response.data;
  localStorage.setItem('admin_token', token);
  if (refreshToken) {
    localStorage.setItem('admin_refresh_token', refreshToken);
  }

  const me = await api.get('/api/me');

  if (!me.data.roles.includes('ROLE_ADMIN')) {
    logout();
    throw new Error(`Access denied. Admin only. User accounts must use ${userPortalUrl}.`);
  }

  localStorage.setItem('admin_user', JSON.stringify(me.data));
  return me.data;
}

export function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('admin_user');
}

export function getUser() {
  return JSON.parse(localStorage.getItem('admin_user') || '{}');
}

export function getToken() {
  return localStorage.getItem('admin_token');
}
