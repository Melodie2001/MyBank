import api from '../api/axios';

export async function getBalanceHistory() {
  const r = await api.get('/api/balance-history');
  return r.data;
}
