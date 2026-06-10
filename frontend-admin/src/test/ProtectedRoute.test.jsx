import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

describe('ProtectedRoute Admin', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children when admin token and role exist', () => {
    localStorage.setItem('admin_token', 'fake-token');
    localStorage.setItem('admin_user', JSON.stringify({
      roles: ['ROLE_ADMIN', 'ROLE_USER']
    }));

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects to login when no token', () => {
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not admin', () => {
    localStorage.setItem('admin_token', 'fake-token');
    localStorage.setItem('admin_user', JSON.stringify({
      roles: ['ROLE_USER']
    }));

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});