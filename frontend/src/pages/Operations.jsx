import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getOperations, deleteOperation } from '../services/operationService';
import { getCategories, addToMyCategories } from '../services/categoryService';
import { getBudgets } from '../services/budgetService';
import OperationCard from '../components/OperationCard';

export default function Operations() {
  const [operations, setOperations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOperation, setEditOperation] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchData();
    if (location.state?.openModal) {
      setShowModal(true);
    }
  }, []);

  async function fetchData() {
    try {
      const [ops, cats, bdgs] = await Promise.all([
        getOperations(),
        getCategories(),
        getBudgets().catch(() => []),
      ]);
      setOperations(ops);
      setCategories(cats);
      setBudgets(bdgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this operation?')) return;
    try {
      await deleteOperation(id);
      setOperations(prev => prev.filter(op => op.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  function handleEdit(op) {
    setEditOperation(op);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setEditOperation(null);
  }

  async function handleSaved() {
    handleModalClose();
    await fetchData();
  }

  const filtered = operations.filter(op => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'income' && op.type === 'income') ||
      (filter === 'expense' && op.type === 'expense');
    const matchSearch = op.label.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>All operations</h1>
        <button style={styles.btnAdd} onClick={() => setShowModal(true)}>
          + Add operation
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <div style={styles.filters}>
            {['all', 'income', 'expense'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...styles.filterBtn,
                  ...(filter === f ? styles.filterBtnActive : {})
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={styles.searchBar}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search operations"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={styles.tableHeader}>
          <span style={styles.col}>DESCRIPTION</span>
          <span style={styles.col}>CATEGORY</span>
          <span style={styles.col}>DATE</span>
          <span style={styles.col}>AMOUNT</span>
          <span style={styles.col}></span>
        </div>

        {filtered.length === 0 ? (
          <div style={styles.empty}>No operations found</div>
        ) : (
          filtered.map(op => (
            <OperationCard
              key={op.id}
              operation={op}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>

      {showModal && (
        <OperationModal
          categories={categories}
          budgets={budgets}
          operation={editOperation}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function OperationModal({ categories, budgets, operation, onClose, onSaved }) {
  const [label, setLabel] = useState(operation?.label || '');
  const [amount, setAmount] = useState(operation?.amount || '');
  const [date, setDate] = useState(operation?.date || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState(operation?.type || 'expense');
  const [categoryId, setCategoryId] = useState(operation?.category?.id || '');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');
  const [editingLimit, setEditingLimit] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Budget for the currently selected category
  const linkedBudget = type === 'expense' && categoryId
    ? budgets.find(b => b.category.id === parseInt(categoryId))
    : null;

  const amountNum = parseFloat(amount) || 0;
  const newSpent = linkedBudget ? linkedBudget.spent + amountNum : 0;
  const newPct = linkedBudget ? Math.min((newSpent / linkedBudget.monthly_limit) * 100, 100) : 0;
  const currentPct = linkedBudget ? Math.min((linkedBudget.spent / linkedBudget.monthly_limit) * 100, 100) : 0;
  const isOver = linkedBudget ? newSpent > linkedBudget.monthly_limit : false;
  const barColor = isOver ? '#DC2626' : newPct >= 80 ? '#D97706' : '#16A34A';

  function handleCategoryChange(e) {
    setCategoryId(e.target.value);
    setNewBudgetLimit('');
    setEditingLimit(false);
  }

  function handleTypeChange(e) {
    setType(e.target.value);
    setNewBudgetLimit('');
    setEditingLimit(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Save or update budget limit if provided
      if (type === 'expense' && categoryId && newBudgetLimit && parseFloat(newBudgetLimit) > 0) {
        const limitVal = parseFloat(newBudgetLimit);
        if (linkedBudget) {
          const { updateBudget } = await import('../services/budgetService');
          await updateBudget(linkedBudget.id, limitVal);
        } else {
          const { createBudget } = await import('../services/budgetService');
          await createBudget(parseInt(categoryId), limitVal);
        }
      }

      const data = {
        label,
        amount: parseFloat(amount),
        date,
        type,
        category_id: parseInt(categoryId)
      };

      if (operation) {
        const { updateOperation } = await import('../services/operationService');
        await updateOperation(operation.id, data);
      } else {
        const { createOperation } = await import('../services/operationService');
        await createOperation(data);
        try {
          await addToMyCategories(parseInt(categoryId));
        } catch (err) {
          if (err.response?.status !== 409) console.error(err);
        }
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const selectedCategory = categories.find(c => c.id === parseInt(categoryId));

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>{operation ? 'Edit Operation' : 'New Operation'}</h2>
        <p style={styles.modalSubtitle}>Fill in the details below to add an entry</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>LABEL</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} style={styles.input} required />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>AMOUNT €</label>
              <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} style={styles.input} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>DATE</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.input} required />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>TYPE</label>
            <select value={type} onChange={handleTypeChange} style={styles.input}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>CATEGORY</label>
            <select value={categoryId} onChange={handleCategoryChange} style={styles.input} required>
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Inline budget management — expense + category selected */}
          {type === 'expense' && categoryId && (
            <div style={styles.budgetSection}>
              <div style={styles.budgetSectionHeader}>
                <span style={styles.budgetSectionTitle}>
                  🎯 Budget — {selectedCategory?.name}
                </span>
                {linkedBudget && !editingLimit && !(amountNum > 0 && (isOver || newPct >= 80)) && (
                  <button type="button" style={styles.btnEditLimit} onClick={() => { setEditingLimit(true); setNewBudgetLimit(String(linkedBudget.monthly_limit)); }}>
                    Edit limit
                  </button>
                )}
              </div>

              {linkedBudget ? (
                <>
                  {/* Current budget status */}
                  {amountNum > 0 && (
                    <>
                      <div style={styles.budgetBar}>
                        <div style={{ ...styles.budgetBarFill, width: `${currentPct}%`, backgroundColor: '#94A3B8', borderRadius: '999px 0 0 999px' }} />
                        <div style={{ ...styles.budgetBarFill, width: `${Math.min(newPct - currentPct, 100 - currentPct)}%`, backgroundColor: barColor, borderRadius: currentPct === 0 ? '999px' : '0 999px 999px 0' }} />
                      </div>
                      <div style={styles.budgetImpactRow}>
                        <span style={styles.budgetImpactSub}>{Number(linkedBudget.spent).toFixed(2)} € + {amountNum.toFixed(2)} €</span>
                        <span style={{ ...styles.budgetImpactSub, fontWeight: '800', color: barColor }}>{Math.round(newPct)}% of {Number(linkedBudget.monthly_limit).toFixed(2)} €</span>
                      </div>
                      {isOver && (
                        <div style={{ ...styles.budgetWarning, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span>⚠️ Over budget by {(newSpent - linkedBudget.monthly_limit).toFixed(2)} €</span>
                          {!editingLimit && (
                            <button type="button" style={styles.btnEditBudget} onClick={() => { setEditingLimit(true); setNewBudgetLimit(String(linkedBudget.monthly_limit)); }}>
                              Edit budget
                            </button>
                          )}
                        </div>
                      )}
                      {!isOver && newPct >= 80 && (
                        <div style={{ ...styles.budgetCaution, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span>⚠️ Only {(linkedBudget.monthly_limit - newSpent).toFixed(2)} € will remain</span>
                          {!editingLimit && (
                            <button type="button" style={styles.btnEditBudget} onClick={() => { setEditingLimit(true); setNewBudgetLimit(String(linkedBudget.monthly_limit)); }}>
                              Edit budget
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {!amountNum && (
                    <div style={styles.budgetImpactSub}>
                      {Number(linkedBudget.spent).toFixed(2)} € spent / {Number(linkedBudget.monthly_limit).toFixed(2)} € limit ({linkedBudget.percentage}%)
                    </div>
                  )}

                  {/* Edit limit inline */}
                  {editingLimit && (
                    <div style={{ ...styles.row, marginTop: '8px' }}>
                      <div style={styles.field}>
                        <label style={styles.label}>NEW MONTHLY LIMIT €</label>
                        <input type="number" step="0.01" min="0.01" value={newBudgetLimit} onChange={e => setNewBudgetLimit(e.target.value)} style={styles.input} placeholder="e.g. 300" />
                      </div>
                      <button type="button" style={{ ...styles.btnEditLimit, alignSelf: 'flex-end', marginBottom: '0', height: '46px' }} onClick={() => { setEditingLimit(false); setNewBudgetLimit(''); }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* No budget for this category — allow creating one */
                <div style={styles.field}>
                  <label style={styles.label}>SET MONTHLY LIMIT € <span style={styles.optionalTag}>optional</span></label>
                  <input type="number" step="0.01" min="0.01" value={newBudgetLimit} onChange={e => setNewBudgetLimit(e.target.value)} style={styles.input} placeholder="e.g. 200 — leave empty to skip" />
                </div>
              )}
            </div>
          )}

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>Cancel</button>
            <button type="submit" style={styles.btnSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save operation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '16px',
    color: 'var(--color-text-light)',
    fontFamily: 'Montserrat, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
    fontFamily: 'Montserrat, sans-serif',
  },
  btnAdd: {
    backgroundColor: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '11px 22px',
    fontWeight: '700',
    fontSize: '13px',
    fontFamily: 'Montserrat, sans-serif',
    cursor: 'pointer',
    boxShadow: '0 10px 24px -8px rgba(37,99,235,0.4)',
  },
  card: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '24px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filters: {
    display: 'flex',
    gap: '6px',
    backgroundColor: 'var(--color-bg)',
    borderRadius: '12px',
    padding: '4px',
  },
  filterBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif',
    color: 'var(--color-text-light)',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: 'var(--color-white)',
    color: '#2563EB',
    boxShadow: '0 1px 3px rgba(11,30,61,0.08)',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--color-input-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: '10px 14px',
    flex: 1,
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '13px',
    fontFamily: 'Montserrat, sans-serif',
    color: 'var(--color-text)',
    flex: 1,
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
    padding: '12px 0',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '8px',
  },
  col: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '700',
    letterSpacing: '0.06em',
    fontFamily: 'Montserrat, sans-serif',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--color-text-light)',
    fontSize: '13px',
    fontFamily: 'Montserrat, sans-serif',
    padding: '40px 0',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(11,30,61,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--color-white)',
    borderRadius: '20px',
    padding: '32px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 20px 60px -20px rgba(11,30,61,0.3)',
    fontFamily: 'Montserrat, sans-serif',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
    marginBottom: '4px',
  },
  modalSubtitle: {
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    marginBottom: '24px',
  },
  error: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-light)',
    letterSpacing: '0.06em',
  },
  input: {
    backgroundColor: 'var(--color-input-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: '12px 14px',
    fontSize: '14px',
    fontFamily: 'Montserrat, sans-serif',
    color: 'var(--color-text)',
    outline: 'none',
    width: '100%',
  },
  budgetSection: {
    backgroundColor: 'var(--color-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '14px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  budgetSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetSectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'Montserrat, sans-serif',
  },
  btnEditLimit: {
    background: 'none',
    border: '1.5px solid var(--color-border)',
    borderRadius: '8px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--color-text-light)',
    fontFamily: 'Montserrat, sans-serif',
    cursor: 'pointer',
  },
  btnEditBudget: {
    background: 'rgba(255,255,255,0.55)',
    border: '1.5px solid rgba(0,0,0,0.08)',
    borderRadius: '8px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'inherit',
    fontFamily: 'Montserrat, sans-serif',
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  optionalTag: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--color-text-light)',
    backgroundColor: 'var(--color-bg-soft)',
    padding: '2px 7px',
    borderRadius: '999px',
    letterSpacing: '0.04em',
    marginLeft: '6px',
    verticalAlign: 'middle',
    textTransform: 'lowercase',
  },
  budgetImpact: {
    backgroundColor: 'var(--color-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '14px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  budgetImpactHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetImpactTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'Montserrat, sans-serif',
  },
  budgetImpactPct: {
    fontSize: '13px',
    fontWeight: '800',
    fontFamily: 'Montserrat, sans-serif',
  },
  budgetBar: {
    height: '8px',
    borderRadius: '999px',
    backgroundColor: 'var(--color-bg-soft)',
    overflow: 'hidden',
    display: 'flex',
  },
  budgetBarFill: {
    height: '100%',
    transition: 'width 0.3s',
  },
  budgetImpactRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  budgetImpactSub: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif',
  },
  budgetWarning: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    padding: '8px 12px',
    borderRadius: '8px',
    fontFamily: 'Montserrat, sans-serif',
  },
  budgetCaution: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FFFBEB',
    padding: '8px 12px',
    borderRadius: '8px',
    fontFamily: 'Montserrat, sans-serif',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  btnCancel: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-light)',
    border: 'none',
    borderRadius: '12px',
    padding: '11px 22px',
    fontWeight: '700',
    fontSize: '13px',
    fontFamily: 'Montserrat, sans-serif',
    cursor: 'pointer',
  },
  btnSave: {
    backgroundColor: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '11px 22px',
    fontWeight: '700',
    fontSize: '13px',
    fontFamily: 'Montserrat, sans-serif',
    cursor: 'pointer',
    boxShadow: '0 10px 24px -8px rgba(37,99,235,0.4)',
  },
};