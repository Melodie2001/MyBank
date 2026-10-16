import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Notifications from '../pages/Notifications';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

vi.mock('../api/axios', () => ({ default: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('../context/useTheme', () => ({ useTheme: () => ({ dark: false, toggleDark: vi.fn() }) }));

beforeEach(() => {
  vi.clearAllMocks();
  let unread = 1;
  api.get.mockImplementation(async url => ({ data: url.endsWith('unread-count') ? { count: unread } : [
    { id: 1, title: 'Fictional expense', message: 'Test', isRead: false, createdAt: new Date().toISOString() },
  ] }));
  api.put.mockImplementation(async () => { unread = 0; return { data: {} }; });
  api.delete.mockImplementation(async () => { unread = 0; return { data: {} }; });
});
afterEach(cleanup);

function renderPage() {
  render(<MemoryRouter><Sidebar /><Notifications /></MemoryRouter>);
}

it('removes a read notification from unread and clears the bell without waiting for polling', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Fictional expense'));
  await waitFor(() => expect(screen.queryByText('Fictional expense')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.getByTitle('Notifications').querySelector('.topbar-bell-badge')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'All', exact: true }));
  expect(screen.getByText('Fictional expense')).toBeInTheDocument();
});

it('clears unread and the bell when marking all as read', async () => {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /Mark all as read/ }));
  await screen.findByText('No unread notifications');
  await waitFor(() => expect(screen.getByTitle('Notifications').querySelector('.topbar-bell-badge')).toBeNull());
});

it('clears the bell after deleting the last unread notification', async () => {
  renderPage();
  fireEvent.click(await screen.findByTitle('Delete'));
  await screen.findByText('No unread notifications');
  await waitFor(() => expect(screen.getByTitle('Notifications').querySelector('.topbar-bell-badge')).toBeNull());
});
