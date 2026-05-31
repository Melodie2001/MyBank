import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, logout, getToken, getUser } from '../services/authService';
import api from '../api/axios';

vi.mock('../api/axios');

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('login stores token and user in localStorage', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'fake-token' } });
    api.get.mockResolvedValueOnce({ data: { id: 1, email: 'test@test.com', firstName: 'Test', lastName: 'User' } });

    await login('test@test.com', 'password');

    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ email: 'test@test.com' });
  });

  it('logout removes token and user from localStorage', () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ email: 'test@test.com' }));

    logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('getToken returns token from localStorage', () => {
    localStorage.setItem('token', 'my-token');
    expect(getToken()).toBe('my-token');
  });

  it('getToken returns null when no token', () => {
    expect(getToken()).toBeNull();
  });

  it('getUser returns user from localStorage', () => {
    const user = { id: 1, email: 'test@test.com' };
    localStorage.setItem('user', JSON.stringify(user));
    expect(getUser()).toMatchObject(user);
  });

  it('getUser returns empty object when no user', () => {
    expect(getUser()).toEqual({});
  });
});