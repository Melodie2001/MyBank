import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Categories from '../pages/Categories';
import { getCategories, getMyCategories, createPersonalCategory } from '../services/categoryService';
import { getOperations } from '../services/operationService';
import { getBudgets } from '../services/budgetService';

vi.mock('../services/categoryService', () => ({ getCategories: vi.fn(), getMyCategories: vi.fn(), addToMyCategories: vi.fn(), removeFromMyCategories: vi.fn(), createPersonalCategory: vi.fn() }));
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
  expect(screen.getByText('€500.00')).toBeInTheDocument();
  expect(screen.getByText('3 operations total')).toBeInTheDocument();
});

it('shows no expenses when a category contains only income', async () => {
  getOperations.mockResolvedValue([{ category, date: new Date().toISOString().slice(0, 10), type: 'income', amount: 500 }]);
  render(<Categories />);
  expect(await screen.findByText('No expenses yet')).toBeInTheDocument();
  expect(screen.getByText('€0.00')).toBeInTheDocument();
  expect(screen.getByText('€500.00')).toBeInTheDocument();
});

it('explains an empty catalog separately from categories already added', async () => {
  getCategories.mockResolvedValue([]);
  getMyCategories.mockResolvedValue([]);
  render(<Categories />);
  fireEvent.click(await screen.findByRole('button', { name: 'Browse catalog' }));
  expect(screen.getByText(/No categories are available yet/)).toBeInTheDocument();
  expect(screen.queryByText('All available categories are already in your list.')).not.toBeInTheDocument();
});

it('keeps the already-added message for a nonempty catalog', async () => {
  render(<Categories />);
  fireEvent.click(await screen.findByRole('button', { name: 'Browse catalog' }));
  expect(screen.getByText('All available categories are already in your list.')).toBeInTheDocument();
});

it('creates a personal category and refreshes the category list', async () => {
  createPersonalCategory.mockResolvedValueOnce({category:{id:9,name:'Freelance'}});
  render(<Categories />);
  fireEvent.click(await screen.findByRole('button', {name:'+ Create category'}));
  const dialog=screen.getByRole('dialog', {name:'Create category'});
  fireEvent.change(within(dialog).getByLabelText('Name *'), {target:{value:'  Freelance  '}});
  fireEvent.click(within(dialog).getByRole('button', {name:'Create category',exact:true}));
  await waitFor(()=>expect(createPersonalCategory).toHaveBeenCalledWith({name:'Freelance',color:'#2563EB',icon:'transfer.png',type:'expense'}));
  await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(getMyCategories).toHaveBeenCalledTimes(2);
});
it('shows only allowed totals and preserves a warning for inconsistent history', async () => {
  const typed = [{ ...category, type: 'expense' }, { ...category, id: 2, name: 'Salaire', type: 'income' }, { ...category, id: 3, name: 'Autres', type: 'both' }];
  getMyCategories.mockResolvedValue(typed);
  getOperations.mockResolvedValue([{ category: typed[1], date: new Date().toISOString().slice(0, 10), type: 'expense', amount: 400 }]);
  render(<Categories />);
  const food = await screen.findByRole('region', { name: 'QA Food' });
  expect(within(food).queryByText('Income this month')).not.toBeInTheDocument();
  expect(within(food).getByText('Expenses this month')).toBeInTheDocument();
  const salary = screen.getByRole('region', { name: 'Salaire' });
  expect(within(salary).queryByText('Expenses this month')).not.toBeInTheDocument();
  expect(within(salary).getByText('Income this month')).toBeInTheDocument();
  expect(within(salary).getByRole('alert')).toHaveTextContent('remain in your balance');
  expect(within(salary).queryByRole('button', { name: /Set a monthly budget/ })).not.toBeInTheDocument();
  const other = screen.getByRole('region', { name: 'Autres' });
  expect(within(other).getByText('Income this month')).toBeInTheDocument();
  expect(within(other).getByText('Expenses this month')).toBeInTheDocument();
});

it('keeps the creation form open when the server rejects a duplicate', async () => {
  createPersonalCategory.mockRejectedValueOnce({response:{data:{message:'You already have a category with this name'}}});
  render(<Categories />);
  fireEvent.click(await screen.findByRole('button', {name:'+ Create category'}));
  fireEvent.change(screen.getByLabelText('Name *'), {target:{value:'Duplicate'}});
  fireEvent.click(screen.getByRole('button', {name:'Create category',exact:true}));
  expect(await screen.findByRole('alert')).toHaveTextContent('already have');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
