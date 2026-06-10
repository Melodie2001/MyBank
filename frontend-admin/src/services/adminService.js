import api from '../api/axios';

export async function getUsers() {
  const response = await api.get('/api/users');
  return response.data;
}

export async function updateUserStatus(id, status) {
  const response = await api.put(`/api/users/${id}/status`, { status });
  return response.data;
}

export async function updateUserRole(id, roles) {
  const response = await api.put(`/api/users/${id}/role`, { roles });
  return response.data;
}

export async function deleteUser(id) {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
}

export async function getAllOperations() {
  const response = await api.get('/api/operations');
  return response.data;
}

export async function getAllCategories() {
  const response = await api.get('/api/categories');
  return response.data;
}