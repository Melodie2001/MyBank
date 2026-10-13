import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import { requestPasswordReset, resetPassword } from '../services/authService';

vi.mock('../services/authService', () => ({ requestPasswordReset: vi.fn(), resetPassword: vi.fn() }));

function LoginConfirmation() {
  const location = useLocation();
  return <p>{location.state?.message}</p>;
}

function show(page, path) {
  render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/login" element={<LoginConfirmation />} />
  </Routes></MemoryRouter>);
  return { user: userEvent.setup(), page };
}

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe('password recovery feedback', () => {
  it('does not claim an email was sent when the network fails and allows retry', async () => {
    requestPasswordReset.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce({});
    const { user } = show('forgot', '/forgot-password');
    await user.type(screen.getByLabelText('EMAIL ADDRESS'), 'someone@example.test');
    await user.click(screen.getByRole('button', { name: /Send reset link/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to request a reset link');
    expect(screen.queryByText(/Check your inbox/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Send reset link/ }));
    expect(await screen.findByText(/Check your inbox/)).toBeInTheDocument();
    expect(screen.getByText(/If an account exists for/)).toBeInTheDocument();
    expect(requestPasswordReset).toHaveBeenCalledTimes(2);
  });

  it('shows a rate limit error without reporting success or revealing account existence', async () => {
    requestPasswordReset.mockRejectedValue({ response: { status: 429, data: { message: 'private detail' } } });
    const { user } = show('forgot', '/forgot-password');
    await user.type(screen.getByLabelText('EMAIL ADDRESS'), 'someone@example.test');
    await user.click(screen.getByRole('button', { name: /Send reset link/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests');
    expect(screen.queryByText(/private detail|Check your inbox/)).not.toBeInTheDocument();
  });

  it('submits the recovery form with the keyboard and blocks repeated submissions while pending', async () => {
    requestPasswordReset.mockReturnValue(new Promise(() => {}));
    const { user } = show('forgot', '/forgot-password');
    await user.tab(); // Back to home.
    await user.tab();
    expect(screen.getByLabelText('EMAIL ADDRESS')).toHaveFocus();
    await user.keyboard('someone@example.test');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
    expect(requestPasswordReset).toHaveBeenCalledOnce();
  });

  it('disables reset when the link has no token', () => {
    show('reset', '/reset-password');
    expect(screen.getByRole('alert')).toHaveTextContent('Please request a new one');
    expect(screen.getByRole('button', { name: /Reset password/ })).toBeDisabled();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords without calling the API', async () => {
    const { user } = show('reset', '/reset-password?token=fictive');
    await user.type(screen.getByLabelText('NEW PASSWORD'), 'Password123!');
    await user.type(screen.getByLabelText('CONFIRM PASSWORD'), 'Different123!');
    await user.click(screen.getByRole('button', { name: /Reset password/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match');
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('reports a connection failure without incorrectly declaring the token expired', async () => {
    resetPassword.mockRejectedValue(new Error('Offline'));
    const { user } = show('reset', '/reset-password?token=fictive');
    await user.type(screen.getByLabelText('NEW PASSWORD'), 'Password123!');
    await user.type(screen.getByLabelText('CONFIRM PASSWORD'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /Reset password/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reset your password');
    expect(screen.queryByText(/expired/)).not.toBeInTheDocument();
  });

  it('makes the visibility toggle accessible and navigates to login after a successful reset', async () => {
    resetPassword.mockResolvedValue({});
    const { user } = show('reset', '/reset-password?token=fictive');
    await user.click(screen.getByRole('button', { name: 'Show passwords' }));
    expect(screen.getByLabelText('NEW PASSWORD')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide passwords' })).toHaveAttribute('aria-pressed', 'true');
    await user.type(screen.getByLabelText('NEW PASSWORD'), 'Password123!');
    await user.type(screen.getByLabelText('CONFIRM PASSWORD'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /Reset password/ }));
    expect(await screen.findByText('Your password has been reset. You can now sign in.')).toBeInTheDocument();
    expect(resetPassword).toHaveBeenCalledWith('fictive', 'Password123!');
  });
});
