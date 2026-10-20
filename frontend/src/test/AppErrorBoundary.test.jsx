import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import AppErrorBoundary from '../components/AppErrorBoundary';

afterEach(cleanup);

it('shows recovery instructions instead of a blank page on render failure', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  function BrokenPage() { throw new Error('Simulated chunk error'); }
  try {
    render(<AppErrorBoundary><BrokenPage /></AppErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to display this page');
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
  } finally { log.mockRestore(); }
});
