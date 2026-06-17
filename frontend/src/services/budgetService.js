import api from '../api/axios';

export async function getBudgets() {
  const response = await api.get('/api/budgets');
  return response.data;
}

export async function createBudget(categoryId, monthlyLimit) {
  const response = await api.post('/api/budgets', {
    category_id: categoryId,
    monthly_limit: monthlyLimit
  });
  return response.data;
}

export async function updateBudget(id, monthlyLimit) {
  const response = await api.put(`/api/budgets/${id}`, {
    monthly_limit: monthlyLimit
  });
  return response.data;
}

export async function deleteBudget(id) {
  const response = await api.delete(`/api/budgets/${id}`);
  return response.data;
}