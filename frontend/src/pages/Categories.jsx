import { useState, useEffect } from 'react';
import { getCategories, getMyCategories, addToMyCategories, removeFromMyCategories } from '../services/categoryService';
import { getOperations } from '../services/operationService';
import { getBudgets, createBudget, updateBudget } from '../services/budgetService';
import { useIsMobile } from '../hooks/useIsMobile';

const ICONS = {
  'house.png': '🏠', 'train.png': '🚆', 'healthcare.png': '❤️',
  'books.png': '📚', 'plane.png': '✈️', 'dog.png': '🐾',
  'briefcase.png': '💼', 'gamepad.png': '🎮', 'burger.png': '🍔',
  'pills.png': '💊', 'entertainment.png': '🎬', 'cart.png': '🛒',
};

export default function Categories() {
  const isMobile = useIsMobile();
  const [myCategories, setMyCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [operations, setOperations] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [budgetEdit, setBudgetEdit] = useState(null); // { catId, value }

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [mine, all, ops, bdgs] = await Promise.all([
        getMyCategories(),
        getCategories(),
        getOperations(),
        getBudgets().catch(() => []),
      ]);
      setMyCategories(mine);
      setAllCategories(all);
      setOperations(ops);
      setBudgets(Array.isArray(bdgs) ? bdgs : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  function getCatStats(catId) {
    const catOps = operations.filter(op => op.category.id === catId);
    const monthlyOps = catOps.filter(op => op.date?.startsWith(thisMonth));
    const monthlyExpenses = monthlyOps.filter(op => op.type === 'expense');
    const monthlyTotal = monthlyOps.reduce((s, op) => s + Number(op.amount), 0);
    const hasExpenses = catOps.some(op => op.type === 'expense');
    return { count: catOps.length, monthlyCount: monthlyOps.length, monthlyTotal, hasExpenses };
  }

  function getCatBudget(catId) {
    return budgets.find(b => (b.category?.id ?? b.category) === catId) ?? null;
  }

  const cardData = myCategories.map(cat => ({
    ...cat,
    ...getCatStats(cat.id),
    budget: getCatBudget(cat.id),
  }));

  const mostSpent = cardData.length
    ? cardData.reduce((m, c) => c.monthlyTotal > m.monthlyTotal ? c : m, cardData[0])
    : null;
  const budgetsSetCount = cardData.filter(c => c.budget).length;
  const alertsCount = cardData.filter(c => c.budget && c.budget.percentage >= 80).length;

  async function handleSaveBudget(cat, existingBudget) {
    if (!budgetEdit?.value || parseFloat(budgetEdit.value) <= 0) return;
    const limit = parseFloat(budgetEdit.value);
    try {
      if (existingBudget) {
        await updateBudget(existingBudget.id, limit);
      } else {
        await createBudget(cat.id, limit);
      }
      setBudgetEdit(null);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAdd(categoryId) {
    try {
      await addToMyCategories(categoryId);
      await fetchData();
      setShowAddModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'An error occurred');
    }
  }

  async function handleRemove(id) {
    if (!window.confirm('Remove this category from your list?')) return;
    try {
      await removeFromMyCategories(id);
      setMyCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot remove this category');
    }
  }

  const availableCategories = allCategories.filter(
    cat => !myCategories.some(mine => mine.id === cat.id)
  );

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ ...s.header, ...(isMobile ? { flexWrap: 'wrap', gap: '12px' } : {}) }}>
        <div>
          <h1 style={s.title}>Categories</h1>
          <p style={s.subtitle}>Manage your expense categories and monthly budgets</p>
        </div>
        <button style={s.btnAdd} onClick={() => setShowAddModal(true)}>+ Add category</button>
      </div>

      {/* Stats row */}
      <div style={{ ...s.statsRow, ...(isMobile ? { gridTemplateColumns: 'repeat(2, 1fr)' } : {}) }}>
        <StatCard label="TOTAL CATEGORIES" value={myCategories.length} sub="In your list" />
        <StatCard
          label="BUDGETS SET"
          value={`${budgetsSetCount} / ${myCategories.length}`}
          sub="Categories with a limit"
        />
        <StatCard
          label="MOST SPENT"
          value={mostSpent?.monthlyTotal > 0 ? mostSpent.name : '—'}
          sub={mostSpent?.monthlyTotal > 0 ? `${mostSpent.monthlyTotal.toFixed(2)} € this month` : 'No expenses yet'}
          valueColor={mostSpent?.monthlyTotal > 0 ? '#DC2626' : 'var(--color-text)'}
        />
        <StatCard
          label="BUDGET ALERTS"
          value={alertsCount}
          sub={alertsCount === 1 ? 'Category over 80%' : 'Categories over 80%'}
          valueColor={alertsCount > 0 ? '#D97706' : 'var(--color-text)'}
        />
      </div>

      {/* Grid */}
      {myCategories.length === 0 ? (
        <div style={s.empty}>No categories yet. Click "+ Add category" to add one.</div>
      ) : (
        <div style={s.grid}>
          {cardData.map(cat => {
            const isEditing = budgetEdit?.catId === cat.id;
            const budget = cat.budget;
            const isOver = budget && budget.percentage > 100;
            const barPct = budget ? Math.min(budget.percentage, 100) : 0;
            const barColor = isOver ? '#DC2626' : budget?.percentage >= 80 ? '#D97706' : '#16A34A';

            return (
              <div key={cat.id} style={s.card}>
                {/* Top: icon + name/ops + dot */}
                <div style={s.cardTop}>
                  <div style={{ ...s.iconBox, backgroundColor: cat.color + '22' }}>
                    <span style={{ fontSize: '22px' }}>{ICONS[cat.icon] || '💰'}</span>
                  </div>
                  <div style={s.cardInfo}>
                    <span style={s.catName}>{cat.name}</span>
                    <span style={s.catOps}>{cat.count} {cat.count === 1 ? 'operation' : 'operations'} total</span>
                  </div>
                  <div style={{ ...s.dot, backgroundColor: cat.color }} />
                </div>

                {/* Amount + badge */}
                <div style={s.amountRow}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ ...s.catTotal, color: isOver ? '#DC2626' : 'var(--color-text)' }}>
                      €{cat.monthlyTotal.toFixed(2)}
                    </span>
                    <span style={s.thisMonth}>
                      {cat.monthlyCount} operation{cat.monthlyCount !== 1 ? 's' : ''} this month
                    </span>
                  </div>
                  {isOver && <span style={s.overBadge}>⚠ Over budget</span>}
                </div>

                {/* Budget — only for expense-capable categories */}
                {(cat.hasExpenses || budget) && budget ? (
                  <div style={s.budgetBox}>
                    <div style={s.budgetHeader}>
                      <span style={s.budgetLabel}>🎯 Monthly budget</span>
                      {!isEditing && (
                        <button
                          style={s.btnEdit}
                          onClick={() => setBudgetEdit({ catId: cat.id, value: String(budget.monthly_limit) })}
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div style={s.editRow}>
                        <input
                          type="number"
                          value={budgetEdit.value}
                          onChange={e => setBudgetEdit(p => ({ ...p, value: e.target.value }))}
                          style={s.budgetInput}
                          min="0.01"
                          step="0.01"
                          autoFocus
                        />
                        <div style={s.editBtns}>
                          <button style={s.btnX} onClick={() => setBudgetEdit(null)}>Cancel</button>
                          <button style={s.btnSave} onClick={() => handleSaveBudget(cat, budget)}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={s.budgetAmounts}>
                          <span style={{ ...s.budgetSpent, color: isOver ? '#DC2626' : 'var(--color-text)' }}>
                            {Number(budget.spent).toFixed(2)} €
                          </span>
                          <span style={s.budgetLimit}>/ {Number(budget.monthly_limit).toFixed(2)} € limit</span>
                        </div>
                        <div style={s.bar}>
                          <div style={{ ...s.barFill, width: `${barPct}%`, backgroundColor: barColor }} />
                        </div>
                        <div style={{ color: barColor, fontSize: '12px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>
                          {isOver
                            ? `${Math.round(budget.percentage)}% — Over by ${Math.abs(Number(budget.remaining)).toFixed(2)} €`
                            : `${Math.round(budget.percentage)}% used — ${Number(budget.remaining).toFixed(2)} € remaining`}
                        </div>
                      </>
                    )}
                  </div>
                ) : (cat.hasExpenses || budget) && isEditing ? (
                  <div style={s.budgetBox}>
                    <div style={s.editRow}>
                      <input
                        type="number"
                        value={budgetEdit.value}
                        onChange={e => setBudgetEdit(p => ({ ...p, value: e.target.value }))}
                        style={s.budgetInput}
                        min="0.01"
                        step="0.01"
                        placeholder="e.g. 200"
                        autoFocus
                      />
                      <div style={s.editBtns}>
                        <button style={s.btnX} onClick={() => setBudgetEdit(null)}>Cancel</button>
                        <button style={s.btnSave} onClick={() => handleSaveBudget(cat, null)}>Save</button>
                      </div>
                    </div>
                  </div>
                ) : cat.hasExpenses ? (
                  <button
                    style={s.btnSetBudget}
                    onClick={() => setBudgetEdit({ catId: cat.id, value: '' })}
                  >
                    + Set a monthly budget
                  </button>
                ) : null}

                <button style={s.btnRemove} onClick={() => handleRemove(cat.id)}>Remove</button>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <SelectCategoryModal
          categories={availableCategories}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, valueColor }) {
  return (
    <div style={s.statCard}>
      <div style={s.statLabel}>{label}</div>
      <div style={{ ...s.statValue, color: valueColor || 'var(--color-text)' }}>{value}</div>
      <div style={s.statSub}>{sub}</div>
    </div>
  );
}

function SelectCategoryModal({ categories, onClose, onAdd }) {
  const isMobile = useIsMobile();
  return (
    <div style={s.overlay}>
      <div style={{ ...s.modal, ...(isMobile ? { padding: '24px 16px', maxHeight: '90vh', overflowY: 'auto', margin: '0 16px' } : {}) }}>
        <div style={s.modalHeader}>
          <div>
            <h2 style={s.modalTitle}>Add a category</h2>
            <p style={s.modalSubtitle}>Select a category to add to your list</p>
          </div>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {categories.length === 0 ? (
          <div style={s.emptyModal}>All available categories are already in your list.</div>
        ) : (
          <div style={{ ...s.catGrid, ...(isMobile ? { gridTemplateColumns: 'repeat(2, 1fr)' } : {}) }}>
            {categories.map(cat => (
              <div key={cat.id} style={s.catOption} onClick={() => onAdd(cat.id)}>
                <div style={{ ...s.iconBox, backgroundColor: cat.color + '22' }}>
                  <span style={{ fontSize: '24px' }}>{ICONS[cat.icon] || '💰'}</span>
                </div>
                <span style={s.optionName}>{cat.name}</span>
                <div style={{ ...s.dot, backgroundColor: cat.color }} />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose} style={s.btnCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '200px', fontSize: '16px', color: 'var(--color-text-light)',
    fontFamily: 'Montserrat, sans-serif',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px',
    color: 'var(--color-text)', fontFamily: 'Montserrat, sans-serif', marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px', color: 'var(--color-text-light)', fontWeight: '500',
    fontFamily: 'Montserrat, sans-serif',
  },
  btnAdd: {
    backgroundColor: '#2563EB', color: '#fff', border: 'none',
    borderRadius: '12px', padding: '11px 22px', fontWeight: '700',
    fontSize: '13px', fontFamily: 'Montserrat, sans-serif', cursor: 'pointer',
    boxShadow: '0 10px 24px -8px rgba(37,99,235,0.4)',
  },

  /* Stats */
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px',
  },
  statCard: {
    backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)',
    borderRadius: '16px', padding: '20px 22px', fontFamily: 'Montserrat, sans-serif',
  },
  statLabel: {
    fontSize: '11px', fontWeight: '700', color: 'var(--color-text-light)',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px',
  },
  statValue: {
    fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px',
    color: 'var(--color-text)', marginBottom: '4px',
  },
  statSub: {
    fontSize: '12px', fontWeight: '500', color: 'var(--color-text-light)',
  },

  /* Grid */
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px',
  },
  card: {
    backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)',
    borderRadius: '18px', padding: '20px', display: 'flex',
    flexDirection: 'column', gap: '0', fontFamily: 'Montserrat, sans-serif',
  },
  cardTop: {
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px',
  },
  cardInfo: {
    display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0,
  },
  iconBox: {
    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  overBadge: {
    fontSize: '11px', fontWeight: '700', color: '#DC2626',
    backgroundColor: '#FEF2F2', borderRadius: '8px', padding: '3px 8px',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  amountRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '8px', marginBottom: '12px',
  },
  catName: {
    fontSize: '15px', fontWeight: '800', color: 'var(--color-text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  catOps: { fontSize: '12px', color: 'var(--color-text-light)', fontWeight: '500' },
  catTotal: {
    fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px',
  },
  thisMonth: {
    fontSize: '11px', fontWeight: '600', color: 'var(--color-text-light)',
  },

  /* Budget box */
  budgetBox: {
    backgroundColor: 'var(--color-bg)', borderRadius: '12px',
    padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px',
    marginBottom: '4px',
  },
  budgetHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  budgetLabel: {
    fontSize: '12px', fontWeight: '700', color: 'var(--color-text-light)',
  },
  btnEdit: {
    background: 'none', border: 'none', color: '#2563EB', fontSize: '12px',
    fontWeight: '700', fontFamily: 'Montserrat, sans-serif', cursor: 'pointer', padding: 0,
  },
  budgetAmounts: { display: 'flex', alignItems: 'baseline', gap: '6px' },
  budgetSpent: { fontSize: '16px', fontWeight: '800' },
  budgetLimit: { fontSize: '12px', fontWeight: '500', color: 'var(--color-text-light)' },
  bar: {
    height: '7px', borderRadius: '999px', backgroundColor: 'var(--color-border)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: '999px', transition: 'width 0.3s ease' },
  editRow: { display: 'flex', flexDirection: 'column', gap: '8px' },
  editBtns: { display: 'flex', gap: '8px' },
  budgetInput: {
    width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--color-border)',
    fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '600',
    backgroundColor: 'var(--color-white)', color: 'var(--color-text)', outline: 'none',
    boxSizing: 'border-box',
  },
  btnSave: {
    flex: 1, backgroundColor: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px',
    padding: '9px 0', fontSize: '12px', fontWeight: '700',
    fontFamily: 'Montserrat, sans-serif', cursor: 'pointer',
  },
  btnX: {
    flex: 1, background: 'none', border: '1.5px solid var(--color-border)', borderRadius: '8px',
    padding: '9px 0', cursor: 'pointer', color: 'var(--color-text-light)',
    fontSize: '12px', fontWeight: '700', fontFamily: 'Montserrat, sans-serif',
  },
  btnSetBudget: {
    backgroundColor: 'transparent', color: 'var(--color-text-light)',
    border: '1.5px dashed var(--color-border)', borderRadius: '10px',
    padding: '9px 0', fontSize: '12px', fontWeight: '700',
    fontFamily: 'Montserrat, sans-serif', cursor: 'pointer', marginBottom: '4px',
    transition: 'border-color 0.15s, color 0.15s',
  },
  btnRemove: {
    width: '100%', backgroundColor: '#FEF2F2', color: '#DC2626', border: 'none',
    borderRadius: '10px', padding: '9px 0', fontSize: '12px', fontWeight: '700',
    fontFamily: 'Montserrat, sans-serif', cursor: 'pointer', marginTop: '8px',
  },

  /* Empty */
  empty: {
    textAlign: 'center', color: 'var(--color-text-light)', fontSize: '14px',
    fontWeight: '500', fontFamily: 'Montserrat, sans-serif', padding: '60px 0',
    backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)',
    borderRadius: '16px',
  },

  /* Modal */
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(11,30,61,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--color-white)', borderRadius: '20px', padding: '32px',
    width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px -20px rgba(11,30,61,0.3)',
    fontFamily: 'Montserrat, sans-serif',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px',
  },
  modalTitle: {
    fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px',
    color: 'var(--color-text)', marginBottom: '4px',
  },
  modalSubtitle: { fontSize: '13px', color: 'var(--color-text-light)', fontWeight: '500' },
  closeBtn: {
    background: 'none', border: '1.5px solid var(--color-border)', borderRadius: '10px',
    width: '30px', height: '30px', cursor: 'pointer', fontSize: '12px',
    color: 'var(--color-text-light)',
  },
  emptyModal: {
    textAlign: 'center', color: 'var(--color-text-light)', fontSize: '13px',
    fontWeight: '500', padding: '24px 0',
  },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' },
  catOption: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    padding: '16px 12px', borderRadius: '14px', border: '1.5px solid var(--color-border)',
    cursor: 'pointer', position: 'relative', transition: 'border-color 0.15s',
  },
  optionName: { fontSize: '13px', fontWeight: '700', color: 'var(--color-text)', textAlign: 'center' },
  btnCancel: {
    backgroundColor: 'transparent', color: 'var(--color-text-light)', border: 'none',
    borderRadius: '12px', padding: '11px 22px', fontWeight: '700', fontSize: '13px',
    fontFamily: 'Montserrat, sans-serif', cursor: 'pointer',
  },
};
