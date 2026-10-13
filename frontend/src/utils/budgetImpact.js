export function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function budgetImpact(budget, operation, { amount, date, categoryId, limit }) {
  const originalContribution = operation?.type === 'expense'
    && Number(operation.category.id) === Number(categoryId)
    && operation.date.slice(0, 7) === date.slice(0, 7)
    ? Number(operation.amount) : 0;
  const baseSpent = Math.round((Number(budget.spent) - originalContribution) * 100) / 100;
  const added = Math.max(0, Number(amount) || 0);
  const newSpent = Math.round((baseSpent + added) * 100) / 100;
  const effectiveLimit = Number(limit) > 0 ? Number(limit) : Number(budget.monthly_limit);
  const percentage = effectiveLimit > 0 ? newSpent / effectiveLimit * 100 : 0;

  return {
    baseSpent,
    newSpent,
    limit: effectiveLimit,
    percentage,
    basePercentage: effectiveLimit > 0 ? Math.min(baseSpent / effectiveLimit * 100, 100) : 0,
    remaining: Math.round((effectiveLimit - newSpent) * 100) / 100,
    reached: newSpent >= effectiveLimit,
  };
}
