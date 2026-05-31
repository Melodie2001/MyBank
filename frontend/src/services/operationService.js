import api from '../api/axios';

export async function getOperations() {
  const response = await api.get('/api/operations');
  return response.data;
}

export async function createOperation(data) {
  const response = await api.post('/api/operations', data);
  return response.data;
}

export async function updateOperation(id, data) {
  const response = await api.put(`/api/operations/${id}`, data);
  return response.data;
}

export async function deleteOperation(id) {
  const response = await api.delete(`/api/operations/${id}`);
  return response.data;
}

export async function getDashboard() {
  const response = await api.get('/api/dashboard');
  return response.data;
}