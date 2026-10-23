import api from '../api/axios';


export async function login(email, password) {
  const response = await api.post('/api/login', { email, password });
  const { token, refresh_token: refreshToken } = response.data;
  localStorage.setItem('admin_token', token);
  if (refreshToken) {
    localStorage.setItem('admin_refresh_token', refreshToken);
  }

  try {
    // The server must authorize the role before the administration session is kept.
    await api.get('/api/admin/access');
    const me = await api.get('/api/me');
    if (!me.data.roles.includes('ROLE_ADMIN')) {
      const error = new Error('This area is reserved for administrators');
      error.code = 'ADMIN_ACCESS_DENIED';
      throw error;
    }
    localStorage.setItem('admin_user', JSON.stringify(me.data));
    return me.data;
  } catch (error) {
    logout();
    if (error.response?.status === 403) error.code = 'ADMIN_ACCESS_DENIED';
    throw error;
  }
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
