import { describe, expect, it } from 'vitest';
import { monthlyChanges } from '../utils/monthlyChanges';

const expense = (date, amount) => ({ date, amount, type: 'expense' });

describe('calendar month comparison', () => {
  it('ignores older and future months and compares the current month to the preceding month', () => {
    const operations = [expense('2026-01-15', 1000), expense('2026-02-15', 100), expense('2026-03-15', 150), expense('2026-04-15', 5000)];
    expect(monthlyChanges(operations, new Date(2026, 2, 20))).toEqual({ expenseChangePct: 50, incomeChangePct: null });
  });
  it('does not compare nonadjacent months when the previous month is empty', () => {
    expect(monthlyChanges([expense('2026-01-15', 100), expense('2026-03-15', 200)], new Date(2026, 2, 20)).expenseChangePct).toBeNull();
  });
  it('shows the decrease when the current month has no operations', () => {
    expect(monthlyChanges([expense('2026-02-15', 100)], new Date(2026, 2, 20)).expenseChangePct).toBe(-100);
  });
  it('handles the change of year and calculates income independently', () => {
    const operations = [expense('2025-12-15', 100), expense('2026-01-15', 80), { date: '2025-12-01', type: 'income', amount: 1000 }, { date: '2026-01-01', type: 'income', amount: 1200 }];
    expect(monthlyChanges(operations, new Date(2026, 0, 20))).toEqual({ expenseChangePct: -20, incomeChangePct: 20 });
  });
});
