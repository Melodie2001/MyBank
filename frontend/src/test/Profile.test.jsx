import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import Profile from '../pages/Profile';
import { getMe, updateMe, updatePassword, deleteMe } from '../services/userService';
import { logout } from '../services/authService';

vi.mock('../services/userService', () => ({ getMe: vi.fn(), updateMe: vi.fn(), updatePassword: vi.fn(), deleteMe: vi.fn() }));
vi.mock('../services/authService', () => ({ logout: vi.fn() }));
const user = { firstName: 'Camille', lastName: 'Test', email: 'camille@example.test', roles: ['ROLE_USER'] };
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); getMe.mockResolvedValue(user); });
function LoginResult() { const location = useLocation(); return <p>{location.state?.message}</p>; }
function show() { render(<MemoryRouter initialEntries={['/profile']}><Routes><Route path="/profile" element={<Profile />} /><Route path="/login" element={<LoginResult />} /></Routes></MemoryRouter>); }

it('shows a compact summary and personal panel, preserving drafts across accessible tabs', async () => {
  show();
  const personal = await screen.findByRole('tab', { name: 'Personal information' });
  expect(personal).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('region', { name: 'Account summary' })).toHaveTextContent('Camille Test');
  fireEvent.change(screen.getByLabelText('First name *'), { target: { value: 'Draft' } });
  personal.focus();
  fireEvent.keyDown(personal, { key: 'ArrowRight' });
  expect(screen.getByRole('tab', { name: 'Security' })).toHaveFocus();
  expect(screen.getByRole('tabpanel', { name: 'Security' })).toBeVisible();
  expect(screen.queryByRole('textbox', { name: 'First name *' })).not.toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Security' }), { key: 'Home' });
  expect(screen.getByLabelText('First name *')).toHaveValue('Draft');
});

it('saves personal details with optional fields empty and updates the summary', async () => {
  updateMe.mockResolvedValue({ user: { ...user, firstName: 'Updated' } });
  show();
  fireEvent.change(await screen.findByLabelText('First name *'), { target: { value: 'Updated' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Profile updated');
  expect(updateMe).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Updated', email: user.email, phone: null, birthDate: null, gender: null }));
  expect(screen.getByRole('region', { name: 'Account summary' })).toHaveTextContent('Updated Test');
});

it('checks password requirements and returns to login after a successful password change', async () => {
  updatePassword.mockResolvedValue({});
  show();
  fireEvent.click(await screen.findByRole('tab', { name: 'Security' }));
  fireEvent.change(screen.getByLabelText('Current password *'), { target: { value: 'CurrentPassword1!' } });
  fireEvent.change(screen.getByLabelText('New password *'), { target: { value: 'DifferentPassword2!' } });
  fireEvent.change(screen.getByLabelText('Confirm new password *'), { target: { value: 'DifferentPassword2!' } });
  expect(within(screen.getByRole('list', { name: 'Password requirements' })).getAllByRole('listitem').every(item => item.textContent.endsWith(' — met'))).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(await screen.findByText('Password updated successfully. Please sign in again.')).toBeInTheDocument();
  expect(logout).toHaveBeenCalled();
});

it('requires explicit deletion confirmation and allows cancellation with Escape', async () => {
  show();
  fireEvent.click(await screen.findByRole('tab', { name: 'Security' }));
  const opener = screen.getByRole('button', { name: 'Delete my account' });
  fireEvent.click(opener);
  const dialog = screen.getByRole('dialog', { name: 'Delete your account?' });
  expect(within(dialog).getByRole('button', { name: 'Yes, delete my account' })).toBeDisabled();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(opener).toHaveFocus();
  expect(deleteMe).not.toHaveBeenCalled();
});

it('shows a loading error instead of an empty account form', async () => {
  getMe.mockRejectedValue(new Error('Offline'));
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try { show(); expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load your data'); }
  finally { spy.mockRestore(); }
});
