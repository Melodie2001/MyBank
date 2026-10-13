import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Categories from '../pages/Categories';
import { getCategories, getMyCategories } from '../services/categoryService';
import { getOperations } from '../services/operationService';
import { getBudgets } from '../services/budgetService';

vi.mock('../services/categoryService', () => ({ getCategories: vi.fn(), getMyCategories: vi.fn(), addToMyCategories: vi.fn(), removeFromMyCategories: vi.fn() }));
vi.mock('../services/operationService', () => ({ getOperations: vi.fn() }));
vi.mock('../services/budgetService', () => ({ getBudgets: vi.fn(), createBudget: vi.fn(), updateBudget: vi.fn() }));
vi.mock('../hooks/useIsMobile', () => ({ useIsMobile: () => false }));

const category = { id: 1, name: 'QA Food', color: '#2563EB', icon: 'cart.png' };
beforeEach(() => {
  vi.clearAllMocks();
  getCategories.mockResolvedValue([category]);
  getMyCategories.mockResolvedValue([category]);
  getOperations.mockResolvedValue([]);
  getBudgets.mockResolvedValue([]);
});
afterEach(cleanup);

it('shows a loading failure instead of claiming there are no budgets', async () => {
  getBudgets.mockRejectedValueOnce(new Error('Simulated outage'));
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    render(<Categories />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load your data');
    expect(screen.queryByText('No expenses yet')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  } finally {
    log.mockRestore();
  }
});

it('excludes income and other months from spending totals', async () => {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-03`;
  getOperations.mockResolvedValue([
    { category, date, type: 'income', amount: 500 },
    { category, date, type: 'expense', amount: 25 },
    { category, date: '2000-01-01', type: 'expense', amount: 100 },
  ]);
  render(<Categories />);
  expect(await screen.findByText('25.00 € this month')).toBeInTheDocument();
  expect(screen.getByText('€25.00')).toBeInTheDocument();
  expect(screen.getByText('3 operations total')).toBeInTheDocument();
});

it('shows no expenses when a category contains only income', async () => {
  getOperations.mockResolvedValue([{ category, date: new Date().toISOString().slice(0, 10), type: 'income', amount: 500 }]);
  render(<Categories />);
  expect(await screen.findByText('No expenses yet')).toBeInTheDocument();
  expect(screen.getByText('€0.00')).toBeInTheDocument();
});

it('explains an empty catalog separately from categories already added', async () => {
  getCategories.mockResolvedValue([]);
  getMyCategories.mockResolvedValue([]);
  render(<Categories />);
  fireEvent.click(await screen.findByRole('button', { name: '+ Add category' }));
  expect(screen.getByText(/No categories are available yet/)).toBeInTheDocument();
  expect(screen.queryByText('All available categories are already in your list.')).not.toBeInTheDocument();
});

it('keeps the already-added message for a nonempty catalog', async () => {
  render(<Categories />);
  fireEvent.click(await screen.findByRole('button', { name: '+ Add category' }));
  expect(screen.getByText('All available categories are already in your list.')).toBeInTheDocument();
});
