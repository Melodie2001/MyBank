import { describe, expect, it } from 'vitest';
import { budgetImpact } from '../utils/budgetImpact';

const budget = { spent: 100, monthly_limit: 100 };
const original = { type: 'expense', amount: 30, date: '2026-01-10', category: { id: 1 } };
const draft = { amount: 40, date: '2026-01-20', categoryId: 1 };

describe('budget impact scenarios', () => {
  it('replaces an existing expense including when the amount decreases', () => {
    expect(budgetImpact(budget, original, draft)).toMatchObject({ baseSpent: 70, newSpent: 110, remaining: -10, reached: true });
    expect(budgetImpact(budget, original, { ...draft, amount: 10 })).toMatchObject({ newSpent: 80, remaining: 20, reached: false });
  });
  it('does not deduct an expense from another month or category, or an income', () => {
    expect(budgetImpact(budget, original, { ...draft, date: '2026-02-20' }).newSpent).toBe(140);
    expect(budgetImpact(budget, original, { ...draft, categoryId: 2 }).newSpent).toBe(140);
    expect(budgetImpact(budget, { ...original, type: 'income' }, draft).newSpent).toBe(140);
  });
  it('adds a new operation and uses cent precision at the exact limit', () => {
    expect(budgetImpact({ spent: 0.1, monthly_limit: 0.3 }, null, { ...draft, amount: 0.2 })).toMatchObject({ newSpent: 0.3, remaining: 0, reached: true });
  });
});
