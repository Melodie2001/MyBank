import Icon from '../components/Icon';
import CategoryIcon from '../components/CategoryIcon';
import { useState, useEffect } from 'react';
import LoadError from '../components/LoadError';
import { getCategories, getMyCategories, addToMyCategories, removeFromMyCategories, createPersonalCategory } from '../services/categoryService';
import { getOperations } from '../services/operationService';
import { getBudgets, createBudget, updateBudget } from '../services/budgetService';
import { useIsMobile } from '../hooks/useIsMobile';
import { acceptsOperation, categoryType } from '../utils/categoryType';


export default function Categories() {
  const isMobile = useIsMobile();
  const [myCategories, setMyCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [operations, setOperations] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [budgetEdit, setBudgetEdit] = useState(null); // { catId, value }

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [mine, all, ops, bdgs] = await Promise.all([
        getMyCategories(),
        getCategories(),
        getOperations(),
        getBudgets(),
      ]);
      setMyCategories(mine);
      setAllCategories(all);
      setOperations(ops);
      setBudgets(Array.isArray(bdgs) ? bdgs : []);
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  function getCatStats(category) {
    const catOps = operations.filter(op => op.category.id === category.id);
    const monthlyOps = catOps.filter(op => op.date?.startsWith(thisMonth));
    const monthlyTotal = monthlyOps.filter(op => op.type === 'expense').reduce((s, op) => s + Number(op.amount), 0);
    const monthlyIncome = monthlyOps.filter(op => op.type === 'income').reduce((sum, op) => sum + Number(op.amount), 0);
    const hasExpenses = catOps.some(op => op.type === 'expense');
    const incompatibleCount = catOps.filter(op => !acceptsOperation(category, op.type)).length;
    return { count: catOps.length, monthlyCount: monthlyOps.length, monthlyTotal, monthlyIncome, hasExpenses, incompatibleCount };
  }

  function getCatBudget(catId) {
    return budgets.find(b => (b.category?.id ?? b.category) === catId) ?? null;
  }

  const cardData = myCategories.map(cat => ({
    ...cat,
    ...getCatStats(cat),
    budget: getCatBudget(cat.id),
  }));

  const expenseCategories = cardData.filter(c => acceptsOperation(c, 'expense'));
  const mostSpent = expenseCategories.length
    ? expenseCategories.reduce((m, c) => c.monthlyTotal > m.monthlyTotal ? c : m, expenseCategories[0])
    : null;
  const budgetsSetCount = expenseCategories.filter(c => c.budget).length;
  const alertsCount = expenseCategories.filter(c => c.budget && c.budget.percentage >= 80).length;

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
  if (loadError) return <LoadError />;

  return (
    <div>
      {/* Header */}
      <div style={{ ...s.header, ...(isMobile ? { flexWrap: 'wrap', gap: '12px' } : {}) }}>
        <div>
          <h1 style={s.title}>Categories</h1>
          <p style={s.subtitle}>Manage your income, expense categories and monthly budgets</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button style={s.btnCancel} onClick={() => setShowAddModal(true)}>Browse catalog</button>
          <button style={s.btnAdd} onClick={() => setShowCreateModal(true)}>+ Create category</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ ...s.statsRow, ...(isMobile ? { gridTemplateColumns: 'repeat(2, 1fr)' } : {}) }}>
        <StatCard label="TOTAL CATEGORIES" value={myCategories.length} sub="In your list" />
        <StatCard
          label="BUDGETS SET"
          value={`${budgetsSetCount} / ${expenseCategories.length}`}
          sub="Expense categories with a limit"
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
        <div style={s.empty}>No categories yet. Create your own category or browse the catalog.</div>
      ) : (
        <div style={s.grid}>
          {cardData.map(cat => {
            const isEditing = budgetEdit?.catId === cat.id;
            const budget = cat.budget;
            const isOver = budget && budget.percentage > 100;
            const barPct = budget ? Math.min(budget.percentage, 100) : 0;
            const barColor = isOver ? '#DC2626' : budget?.percentage >= 80 ? '#D97706' : '#16A34A';

            return (
              <section key={cat.id} aria-label={cat.name} style={s.card}>
                {/* Top: icon + name/ops + dot */}
                <div style={s.cardTop}>
                  <div style={{ ...s.iconBox, backgroundColor: cat.color + '22' }}>
                    <span style={{ fontSize: '22px' }}><CategoryIcon category={cat} /></span>
                  </div>
                  <div style={s.cardInfo}>
                    <span style={s.catName}>{cat.name}</span>
                    <span style={s.catOps}>{categoryType(cat) === 'both' ? 'Income & expense' : categoryType(cat) === 'income' ? 'Income only' : 'Expense only'}</span>
                    <span style={s.catOps}>{cat.count} {cat.count === 1 ? 'operation' : 'operations'} total</span>
                  </div>
                  <div style={{ ...s.dot, backgroundColor: cat.color }} />
                </div>

                {/* Amount + badge */}
                <div style={s.amountRow}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {acceptsOperation(cat, 'income') && <>
                      <span style={s.thisMonth}>Income this month</span>
                      <span style={{ ...s.catTotal, color: '#15803D' }}>€{cat.monthlyIncome.toFixed(2)}</span>
                    </>}
                    {acceptsOperation(cat, 'expense') && <>
                    <span style={{ ...s.thisMonth, marginTop: acceptsOperation(cat, 'income') ? '8px' : 0 }}>Expenses this month</span>
                    <span style={{ ...s.catTotal, color: isOver ? '#DC2626' : 'var(--color-text)' }}>
                      €{cat.monthlyTotal.toFixed(2)}
                    </span>
                    </>}
                    <span style={s.thisMonth}>
                      {cat.monthlyCount} operation{cat.monthlyCount !== 1 ? 's' : ''} this month
                    </span>
                  </div>
                  {isOver && <span style={s.overBadge}><Icon name="alert" /> Over budget</span>}
                </div>

                {cat.incompatibleCount > 0 && <p role="alert" style={{ color: '#B45309', fontSize: '12px', marginBottom: '12px' }}>
                  {cat.incompatibleCount} existing operation(s) use an incompatible type. They remain in your balance. Correct their category in <a href="/operations" style={{ textDecoration: 'underline' }}>Operations</a>.
                </p>}

                {/* Budget — only for expense-capable categories */}
                {acceptsOperation(cat, 'expense') && budget ? (
                  <div style={s.budgetBox}>
                    <div style={s.budgetHeader}>
                      <span style={s.budgetLabel}><Icon name="target" /> Monthly budget</span>
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
                        <div style={{ color: barColor, fontSize: '12px', fontWeight: '700', fontFamily: 'Inter, sans-serif' }}>
                          {isOver
                            ? `${Math.round(budget.percentage)}% — Over by ${Math.abs(Number(budget.remaining)).toFixed(2)} €`
                            : `${Math.round(budget.percentage)}% used — ${Number(budget.remaining).toFixed(2)} € remaining`}
                        </div>
                      </>
                    )}
                  </div>
                ) : acceptsOperation(cat, 'expense') && isEditing ? (
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
                ) : acceptsOperation(cat, 'expense') ? (
                  <button
                    style={s.btnSetBudget}
                    onClick={() => setBudgetEdit({ catId: cat.id, value: '' })}
                  >
                    + Set a monthly budget
                  </button>
                ) : null}

                <button style={s.btnRemove} onClick={() => handleRemove(cat.id)}>Remove from my list</button>
              </section>
            );
          })}
        </div>
      )}

      {showCreateModal && <CreateCategoryModal onClose={() => setShowCreateModal(false)} onCreated={async () => {
        setShowCreateModal(false);
        await fetchData();
      }} />}
      {showAddModal && (
        <SelectCategoryModal
          categories={availableCategories}
          catalogEmpty={allCategories.length === 0}
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

function CreateCategoryModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [icon, setIcon] = useState('transfer.png');
  const [type, setType] = useState('expense');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) { setError('Category name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await createPersonalCategory({ name: name.trim(), color, icon, type });
      await onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create the category. Please try again.');
      setSaving(false);
    }
  }
  return <div style={{ ...s.overlay, padding: '16px' }}>
    <div role="dialog" aria-modal="true" aria-labelledby="create-category-title" style={{ ...s.modal, padding: '24px', maxHeight: '90dvh', overflowY: 'auto' }}>
      <h2 id="create-category-title" style={s.modalTitle}>Create category</h2>
      <p style={{ ...s.modalSubtitle, marginBottom: '20px' }}>Only you can use this category. It will appear in the category selector when you add an operation.</p>
      {error && <p role="alert" style={{ color: '#DC2626', marginBottom: '12px' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label htmlFor="category-name">Name *</label>
        <input id="category-name" value={name} onChange={e => setName(e.target.value)} maxLength={255} required autoFocus style={s.budgetInput} />
        <label htmlFor="category-type">Category type *</label>
        <select id="category-type" value={type} onChange={e => setType(e.target.value)} style={s.budgetInput}>
          <option value="expense">Expense only</option>
          <option value="income">Income only</option>
          <option value="both">Income & expense</option>
        </select>
        <label htmlFor="category-color">Color</label>
        <input id="category-color" type="color" value={color} onChange={e => setColor(e.target.value)} />
        <label htmlFor="category-icon">Icon</label>
        <select id="category-icon" value={icon} onChange={e => setIcon(e.target.value)} style={s.budgetInput}>
          {Object.entries({ 'transfer.png': 'General', 'cart.png': 'Shopping', 'house.png': 'Home', 'train.png': 'Transport', 'briefcase.png': 'Work', 'books.png': 'Education', 'plane.png': 'Travel', 'healthcare.png': 'Health', 'gamepad.png': 'Leisure' }).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowWrap: 'anywhere' }}><CategoryIcon category={{ icon, color }} /><span>{name || 'Category preview'}</span></div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" disabled={saving} onClick={onClose} style={s.btnCancel}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...s.btnAdd, opacity: saving ? .6 : 1 }}>{saving ? 'Creating...' : 'Create category'}</button>
        </div>
      </form>
    </div>
  </div>;
}

function SelectCategoryModal({ categories, catalogEmpty, onClose, onAdd }) {
  const isMobile = useIsMobile();
  return (
    <div style={s.overlay}>
      <div style={{ ...s.modal, ...(isMobile ? { padding: '24px 16px', maxHeight: '90vh', overflowY: 'auto', margin: '0 16px' } : {}) }}>
        <div style={s.modalHeader}>
          <div>
            <h2 style={s.modalTitle}>Browse catalog</h2>
            <p style={s.modalSubtitle}>Select a category to add to your list</p>
          </div>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {categories.length === 0 ? (
          <div style={s.emptyModal}>
            {catalogEmpty
              ? 'No categories are available yet. Ask an administrator to add categories to the catalog.'
              : 'All available categories are already in your list.'}
          </div>
        ) : (
          <div style={{ ...s.catGrid, ...(isMobile ? { gridTemplateColumns: 'repeat(2, 1fr)' } : {}) }}>
            {categories.map(cat => (
              <div key={cat.id} style={s.catOption} onClick={() => onAdd(cat.id)}>
                <div style={{ ...s.iconBox, backgroundColor: cat.color + '22' }}>
                  <span style={{ fontSize: '24px' }}><CategoryIcon category={cat} /></span>
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
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px',
    color: 'var(--color-text)', fontFamily: 'Inter, sans-serif', marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px', color: 'var(--color-text-light)', fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
  },
  btnAdd: {
    backgroundColor: '#2563EB', color: '#fff', border: 'none',
    borderRadius: '12px', padding: '11px 22px', fontWeight: '700',
    fontSize: '13px', fontFamily: 'Inter, sans-serif', cursor: 'pointer',
    boxShadow: '0 10px 24px -8px rgba(37,99,235,0.4)',
  },

  /* Stats */
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px',
  },
  statCard: {
    backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)',
    borderRadius: '16px', padding: '20px 22px', fontFamily: 'Inter, sans-serif',
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
    flexDirection: 'column', gap: '0', fontFamily: 'Inter, sans-serif',
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
    fontWeight: '700', fontFamily: 'Inter, sans-serif', cursor: 'pointer', padding: 0,
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
    fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: '600',
    backgroundColor: 'var(--color-white)', color: 'var(--color-text)', outline: 'none',
    boxSizing: 'border-box',
  },
  btnSave: {
    flex: 1, backgroundColor: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px',
    padding: '9px 0', fontSize: '12px', fontWeight: '700',
    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  },
  btnX: {
    flex: 1, background: 'none', border: '1.5px solid var(--color-border)', borderRadius: '8px',
    padding: '9px 0', cursor: 'pointer', color: 'var(--color-text-light)',
    fontSize: '12px', fontWeight: '700', fontFamily: 'Inter, sans-serif',
  },
  btnSetBudget: {
    backgroundColor: 'transparent', color: 'var(--color-text-light)',
    border: '1.5px dashed var(--color-border)', borderRadius: '10px',
    padding: '9px 0', fontSize: '12px', fontWeight: '700',
    fontFamily: 'Inter, sans-serif', cursor: 'pointer', marginBottom: '4px',
    transition: 'border-color 0.15s, color 0.15s',
  },
  btnRemove: {
    width: '100%', backgroundColor: '#FEF2F2', color: '#DC2626', border: 'none',
    borderRadius: '10px', padding: '9px 0', fontSize: '12px', fontWeight: '700',
    fontFamily: 'Inter, sans-serif', cursor: 'pointer', marginTop: '8px',
  },

  /* Empty */
  empty: {
    textAlign: 'center', color: 'var(--color-text-light)', fontSize: '14px',
    fontWeight: '500', fontFamily: 'Inter, sans-serif', padding: '60px 0',
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
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  },
};
