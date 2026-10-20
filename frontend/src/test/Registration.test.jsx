import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import Register from '../pages/Register';
import { register } from '../services/authService';

vi.mock('../services/authService', () => ({ register: vi.fn() }));
vi.mock('../components/GoogleButton', () => ({ default: () => null }));
vi.mock('../hooks/useIsMobile', () => ({ useIsMobile: () => false }));
afterEach(cleanup);

function LoginPage() {
  const location = useLocation();
  return <h1>{location.state?.message}</h1>;
}

it('shows each password requirement before typing and updates it when satisfied or removed', () => {
  render(<MemoryRouter><Register /></MemoryRouter>);
  const list = screen.getByRole('list', { name: 'Password requirements' });
  expect(within(list).getAllByText(/not yet met/)).toHaveLength(5);
  const password = screen.getByLabelText('PASSWORD', { exact: true });
  expect(password).toHaveAttribute('aria-describedby', 'password-requirements');
  fireEvent.change(password, { target: { value: 'Password1!' } });
  expect(within(list).getAllByText(/^— met$/)).toHaveLength(5);
  fireEvent.change(password, { target: { value: 'password1!' } });
  expect(within(list).getAllByText(/not yet met/)).toHaveLength(1);
  expect(within(list).getByText(/One uppercase letter/)).toHaveTextContent('not yet met');
});

it('redirects a successful registration to login with immediate access confirmation', async () => {
  register.mockResolvedValueOnce({});
  render(<MemoryRouter initialEntries={['/register']}><Routes>
    <Route path="/register" element={<Register />} />
    <Route path="/login" element={<LoginPage />} />
  </Routes></MemoryRouter>);
  fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: 'Camille' } });
  fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Test' } });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'new@example.test' } });
  fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'Password123!' } });
  fireEvent.change(screen.getByPlaceholderText('Repeat your password'), { target: { value: 'Password123!' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: /Create my account/ }));
  expect(await screen.findByRole('heading', { name: 'Account created! You can now sign in.' })).toBeInTheDocument();
  expect(register).toHaveBeenCalledTimes(1);
});
