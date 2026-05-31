import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOperations, createOperation, updateOperation, deleteOperation, getDashboard } from '../services/operationService';
import api from '../api/axios';

vi.mock('../api/axios');

describe('operationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getOperations returns list of operations', async () => {
    const mockOperations = [
      { id: 1, label: 'Groceries', amount: 50, date: '2025-01-01', type: 'expense', category: { id: 1, name: 'Food' } },
      { id: 2, label: 'Salary', amount: 2000, date: '2025-01-01', type: 'income', category: { id: 2, name: 'Work' } }
    ];
    api.get.mockResolvedValueOnce({ data: mockOperations });

    const result = await getOperations();
    expect(result).toEqual(mockOperations);
    expect(api.get).toHaveBeenCalledWith('/api/operations');
  });

  it('createOperation sends correct data', async () => {
    const newOp = { label: 'Rent', amount: 800, date: '2025-01-01', type: 'expense', category_id: 1 };
    api.post.mockResolvedValueOnce({ data: { message: 'Operation created', operation: { id: 3, ...newOp } } });

    const result = await createOperation(newOp);
    expect(api.post).toHaveBeenCalledWith('/api/operations', newOp);
    expect(result.operation.label).toBe('Rent');
  });

  it('updateOperation sends correct data', async () => {
    const updatedOp = { label: 'Updated Rent', amount: 900 };
    api.put.mockResolvedValueOnce({ data: { message: 'Operation updated', operation: { id: 1, ...updatedOp } } });

    const result = await updateOperation(1, updatedOp);
    expect(api.put).toHaveBeenCalledWith('/api/operations/1', updatedOp);
    expect(result.operation.label).toBe('Updated Rent');
  });

  it('deleteOperation calls correct endpoint', async () => {
    api.delete.mockResolvedValueOnce({ data: { message: 'Operation deleted' } });

    const result = await deleteOperation(1);
    expect(api.delete).toHaveBeenCalledWith('/api/operations/1');
    expect(result.message).toBe('Operation deleted');
  });

  it('getDashboard returns balance income and expenses', async () => {
    const mockDashboard = { balance: 1500, income: 2000, expenses: 500, recent_operations: [] };
    api.get.mockResolvedValueOnce({ data: mockDashboard });

    const result = await getDashboard();
    expect(result.balance).toBe(1500);
    expect(result.income).toBe(2000);
    expect(result.expenses).toBe(500);
  });
});