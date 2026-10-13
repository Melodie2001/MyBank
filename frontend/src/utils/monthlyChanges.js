export function monthlyChanges(operations, now = new Date()) {
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previous = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
  const totals = {
    [current]: { income: 0, expense: 0 },
    [previous]: { income: 0, expense: 0 },
  };
  for (const operation of operations) {
    const month = operation.date.slice(0, 7);
    if (totals[month] && ['income', 'expense'].includes(operation.type)) {
      totals[month][operation.type] += Number(operation.amount);
    }
  }
  const change = type => {
    const before = totals[previous][type];
    return before > 0 ? Math.round((totals[current][type] - before) / before * 100) : null;
  };

  return { incomeChangePct: change('income'), expenseChangePct: change('expense') };
}
