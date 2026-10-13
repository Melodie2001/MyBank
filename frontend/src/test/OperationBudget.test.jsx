import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperationModal } from '../pages/Operations';
import { getBudgets } from '../services/budgetService';
import { updateOperation } from '../services/operationService';

vi.mock('../services/budgetService', () => ({ getBudgets: vi.fn(), createBudget: vi.fn(), updateBudget: vi.fn() }));
vi.mock('../services/operationService', () => ({ getOperations: vi.fn(), deleteOperation: vi.fn(), createOperation: vi.fn(), updateOperation: vi.fn() }));

const categories = [{ id: 1, name: 'Food' }, { id: 2, name: 'Transport' }];
const operation = { id: 5, label: 'Groceries', amount: 30, type: 'expense', date: '2026-01-15', category: categories[0] };
const budget = (id, spent, month = '2026-01') => ({ id, spent, monthly_limit: 100, percentage: spent, month, category: categories[id - 1] });
const show = () => render(<OperationModal categories={categories} operation={operation} onClose={vi.fn()} onSaved={vi.fn()} />);

beforeEach(() => { vi.clearAllMocks(); });

describe('monthly budget preview', () => {
  it('replaces the original amount and shows percentages above 100', async () => {
    getBudgets.mockResolvedValue([budget(1, 100)]);
    show();
    fireEvent.change(screen.getByLabelText('AMOUNT €'), { target: { value: '40' } });
    expect(await screen.findByText('70.00 € + 40.00 € = 110.00 € after saving')).toBeInTheDocument();
    expect(screen.getByText('110% of 100.00 €')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Over budget by 10.00 €')).toBeInTheDocument();
    expect(getBudgets).toHaveBeenCalledWith('2026-01');
  });

  it('does not subtract the old expense from a different category', async () => {
    getBudgets.mockResolvedValue([budget(1, 100), budget(2, 50)]);
    show();
    await screen.findByText(/70.00 € \+ 30.00 €/);
    fireEvent.change(screen.getByLabelText('CATEGORY'), { target: { value: '2' } });
    expect(screen.getByText('50.00 € + 30.00 € = 80.00 € after saving')).toBeInTheDocument();
  });

  it('loads the chosen month and removes the previous-month preview while loading', async () => {
    let resolveFebruary;
    getBudgets.mockResolvedValueOnce([budget(1, 100)]).mockImplementationOnce(() => new Promise(resolve => { resolveFebruary = resolve; }));
    show();
    await screen.findByText(/70.00 € \+ 30.00 €/);
    fireEvent.change(screen.getByLabelText('DATE'), { target: { value: '2026-02-15' } });
    expect(screen.queryByText(/70.00 € \+ 30.00 €/)).not.toBeInTheDocument();
    expect(screen.getByText('Loading monthly budget...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save operation' })).toBeDisabled();
    await act(async () => resolveFebruary([budget(1, 20, '2026-02')]));
    expect(screen.getByText('20.00 € + 30.00 € = 50.00 € after saving')).toBeInTheDocument();
    expect(getBudgets).toHaveBeenLastCalledWith('2026-02');
  });

  it('ignores a late response from the old month', async () => {
    let resolveJanuary;
    getBudgets.mockImplementationOnce(() => new Promise(resolve => { resolveJanuary = resolve; }))
      .mockResolvedValueOnce([budget(1, 20, '2026-02')]);
    show();
    fireEvent.change(screen.getByLabelText('DATE'), { target: { value: '2026-02-15' } });
    await screen.findByText('20.00 € + 30.00 € = 50.00 € after saving');
    await act(async () => resolveJanuary([budget(1, 100)]));
    expect(screen.getByText('20.00 € + 30.00 € = 50.00 € after saving')).toBeInTheDocument();
    expect(screen.queryByText(/70.00 € \+ 30.00 €/)).not.toBeInTheDocument();
  });

  it('reports load failures and retries without offering a duplicate budget', async () => {
    getBudgets.mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce([budget(1, 100)]);
    show();
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load the budget for this month.');
    expect(screen.getByRole('button', { name: 'Save operation' })).toBeDisabled();
    expect(screen.queryByPlaceholderText('e.g. 200 — leave empty to skip')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('70.00 € + 30.00 € = 100.00 € after saving');
    expect(screen.getByRole('button', { name: 'Save operation' })).toBeEnabled();
  });

  it('previews the edited limit and saves the operation successfully', async () => {
    getBudgets.mockResolvedValue([budget(1, 100)]);
    updateOperation.mockResolvedValue({});
    show();
    await screen.findByText('⚠️ Budget reached');
    fireEvent.click(screen.getByRole('button', { name: 'Edit budget' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. 300'), { target: { value: '200' } });
    expect(screen.getByText('50% of 200.00 €')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save operation' }));
    await waitFor(() => expect(updateOperation).toHaveBeenCalledWith(5, expect.objectContaining({ amount: 30, date: '2026-01-15', category_id: 1 })));
  });
});
