import api from '../api/axios';

export async function getCategories() {
  const response = await api.get('/api/categories');
  return response.data;
}

export async function createCategory(data) {
  const response = await api.post('/api/categories', data);
  return response.data;
}

export async function updateCategory(id, data) {
  const response = await api.put(`/api/categories/${id}`, data);
  return response.data;
}

export async function deleteCategory(id) {
  const response = await api.delete(`/api/categories/${id}`);
  return response.data;
}