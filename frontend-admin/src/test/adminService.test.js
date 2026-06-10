import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUsers, updateUserStatus, updateUserRole, deleteUser, getAllOperations } from '../services/adminService';
import api from '../api/axios';

vi.mock('../api/axios');

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getUsers returns list of users', async () => {
    const mockUsers = [
      { id: 1, email: 'user1@test.com', roles: ['ROLE_USER'], status: 'active' },
      { id: 2, email: 'user2@test.com', roles: ['ROLE_USER'], status: 'pending' }
    ];
    api.get.mockResolvedValueOnce({ data: mockUsers });

    const result = await getUsers();
    expect(result).toEqual(mockUsers);
    expect(api.get).toHaveBeenCalledWith('/api/users');
  });

  it('updateUserStatus sends correct data', async () => {
    api.put.mockResolvedValueOnce({ data: { message: 'User status updated' } });

    const result = await updateUserStatus(1, 'active');
    expect(api.put).toHaveBeenCalledWith('/api/users/1/status', { status: 'active' });
    expect(result.message).toBe('User status updated');
  });

  it('updateUserRole sends correct data', async () => {
    api.put.mockResolvedValueOnce({ data: { message: 'User role updated' } });

    const result = await updateUserRole(1, ['ROLE_ADMIN', 'ROLE_USER']);
    expect(api.put).toHaveBeenCalledWith('/api/users/1/role', { roles: ['ROLE_ADMIN', 'ROLE_USER'] });
    expect(result.message).toBe('User role updated');
  });

  it('deleteUser calls correct endpoint', async () => {
    api.delete.mockResolvedValueOnce({ data: { message: 'User deleted successfully' } });

    const result = await deleteUser(1);
    expect(api.delete).toHaveBeenCalledWith('/api/users/1');
    expect(result.message).toBe('User deleted successfully');
  });

  it('getAllOperations returns list of operations', async () => {
    const mockOps = [
      { id: 1, label: 'Groceries', amount: 50, type: 'expense' },
      { id: 2, label: 'Salary', amount: 2000, type: 'income' }
    ];
    api.get.mockResolvedValueOnce({ data: mockOps });

    const result = await getAllOperations();
    expect(result).toEqual(mockOps);
    expect(api.get).toHaveBeenCalledWith('/api/operations');
  });
});