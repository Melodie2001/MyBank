import api from '../api/axios';

export async function login(email, password) {
  const response = await api.post('/api/login', { email, password });
  const { token } = response.data;
  localStorage.setItem('admin_token', token);

  const me = await api.get('/api/me');

  if (!me.data.roles.includes('ROLE_ADMIN')) {
    localStorage.removeItem('admin_token');
    throw new Error('Access denied. Admin only.');
  }

  localStorage.setItem('admin_user', JSON.stringify(me.data));
  return me.data;
}

export function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

export function getUser() {
  return JSON.parse(localStorage.getItem('admin_user') || '{}');
}

export function getToken() {
  return localStorage.getItem('admin_token');
}