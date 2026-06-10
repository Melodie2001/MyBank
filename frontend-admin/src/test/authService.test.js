import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, logout, getToken, getUser } from '../services/authService';
import api from '../api/axios';

vi.mock('../api/axios');

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('login stores admin token and user in localStorage', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'admin-token' } });
    api.get.mockResolvedValueOnce({
      data: {
        id: 1,
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['ROLE_ADMIN', 'ROLE_USER']
      }
    });

    await login('admin@test.com', 'password');

    expect(localStorage.getItem('admin_token')).toBe('admin-token');
    expect(JSON.parse(localStorage.getItem('admin_user'))).toMatchObject({
      email: 'admin@test.com'
    });
  });

  it('login throws error if user is not admin', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'user-token' } });
    api.get.mockResolvedValueOnce({
      data: {
        id: 2,
        email: 'user@test.com',
        roles: ['ROLE_USER']
      }
    });

    await expect(login('user@test.com', 'password')).rejects.toThrow('Access denied. Admin only.');
    expect(localStorage.getItem('admin_token')).toBeNull();
  });

  it('logout removes admin token and user from localStorage', () => {
    localStorage.setItem('admin_token', 'admin-token');
    localStorage.setItem('admin_user', JSON.stringify({ email: 'admin@test.com' }));

    logout();

    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(localStorage.getItem('admin_user')).toBeNull();
  });

  it('getToken returns admin token from localStorage', () => {
    localStorage.setItem('admin_token', 'my-admin-token');
    expect(getToken()).toBe('my-admin-token');
  });

  it('getToken returns null when no token', () => {
    expect(getToken()).toBeNull();
  });

  it('getUser returns admin user from localStorage', () => {
    const user = { id: 1, email: 'admin@test.com', roles: ['ROLE_ADMIN'] };
    localStorage.setItem('admin_user', JSON.stringify(user));
    expect(getUser()).toMatchObject(user);
  });
});