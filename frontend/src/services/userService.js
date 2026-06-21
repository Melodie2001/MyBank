import api from '../api/axios';

export async function getMe() {
  const response = await api.get('/api/me');
  return response.data;
}

export async function updateMe(data) {
  const response = await api.put('/api/me', data);
  return response.data;
}

export async function updatePassword(currentPassword, newPassword) {
  const response = await api.put('/api/me/password', {
    current_password: currentPassword,
    new_password: newPassword
  });
  return response.data;
}

export async function deleteMe() {
  const response = await api.delete('/api/me');
  return response.data;
}