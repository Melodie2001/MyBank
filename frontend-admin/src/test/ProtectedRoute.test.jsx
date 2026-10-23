import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Forbidden from '../pages/Forbidden';

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

  it('shows the forbidden page and user login link when user is not admin', () => {
    localStorage.setItem('admin_token', 'fake-token');
    localStorage.setItem('admin_user', JSON.stringify({
      roles: ['ROLE_USER']
    }));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><div>Admin Content</div></ProtectedRoute>} />
          <Route path="/forbidden" element={<Forbidden />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to user login' })).toHaveAttribute('href', 'https://nexo-finance.duckdns.org/login');
  });
});
