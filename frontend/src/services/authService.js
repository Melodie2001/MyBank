import api from '../api/axios';

export async function login(email, password) {
 const response = await api.post('/api/login', { email, password });
  const { token } = response.data;
  localStorage.setItem('token', token);

  const me = await api.get('/api/me');
  localStorage.setItem('user', JSON.stringify(me.data));

  return me.data;
}

export async function register(email, password, firstName, lastName) {
  const response = await api.post('/api/register', { email, password, firstName, lastName });
  return response.data;
}


export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}