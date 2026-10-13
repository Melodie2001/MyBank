import api from '../api/axios';

const adminPortalUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';

function storeTokens(data) {
  localStorage.setItem('token', data.token);
  if (data.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token);
  }
}

async function finishAuth() {
  const me = await api.get('/api/me');

  // Bloquer les admins sur le frontend user
  if (me.data.roles.includes('ROLE_ADMIN')) {
    logout();
    throw new Error(`Admin accounts must use the admin portal at ${adminPortalUrl}`);
  }

  localStorage.setItem('user', JSON.stringify(me.data));
  return me.data;
}

export async function login(email, password) {
  const response = await api.post('/api/login', { email, password });
  storeTokens(response.data);
  return finishAuth();
}

export async function exchangeOAuthCode(code) {
  const response = await api.post('/api/auth/oauth/exchange', { code });
  storeTokens(response.data);
  return finishAuth();
}

export async function register(email, password, firstName, lastName, phone, birthDate, gender) {
  const response = await api.post('/api/register', { email, password, firstName, lastName, phone, birthDate, gender });
  return response.data;
}

export async function requestPasswordReset(email) {
  const response = await api.post('/api/forgot-password', { email });
  return response.data;
}

export async function resetPassword(token, newPassword) {
  const response = await api.post('/api/reset-password', { token, newPassword });
  return response.data;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}
