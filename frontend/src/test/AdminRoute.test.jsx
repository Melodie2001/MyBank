import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminRoute from '../components/AdminRoute';

describe('AdminRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children when user is admin', () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ roles: ['ROLE_ADMIN', 'ROLE_USER'] }));

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects to dashboard when user is not admin', () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ roles: ['ROLE_USER'] }));

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects to login when no token', () => {
    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});