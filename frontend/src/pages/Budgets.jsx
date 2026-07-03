import { useState, useEffect } from 'react';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../services/budgetService';
import { getCategories } from '../services/categoryService';

const ICONS = {
  'house.png': '🏠',
  'train.png': '🚆',
  'healthcare.png': '❤️',
  'books.png': '📚',
  'plane.png': '✈️',
  'dog.png': '🐾',
  'briefcase.png': '💼',
  'gamepad.png': '🎮',
  'burger.png': '🍔',
  'pills.png': '💊',
  'entertainment.png': '🎬',
  'cart.png': '🛒',
  'transfer.png': '💸',
};

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [b, c] = await Promise.all([getBudgets(), getCategories()]);
      setBudgets(b);
      setCategories(c);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(budget) {
    setEditBudget(budget);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setEditBudget(null);
  }

  async function handleSaved() {
    handleModalClose();
    await fetchData();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await deleteBudget(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  const categoriesWithoutBudget = categories.filter(
    cat => !budgets.some(b => b.category.id === cat.id)
  );

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Budgets</h1>
          <p style={styles.subtitle}>Set monthly spending limits per category</p>
        </div>
        {categoriesWithoutBudget.length > 0 && (
          <button style={styles.btnAdd} onClick={() => setShowModal(true)}>
            + New budget
          </button>
        )}
      </div>

      {budgets.length === 0 ? (
        <div style={styles.empty}>
          No budgets yet. Click "+ New budget" to set a monthly limit for one of your categories.
        </div>
      ) : (
        <div style={styles.grid}>
          {budgets.map(budget => {
            const pct = Math.min(budget.percentage, 100);
            const isOver = budget.percentage > 100;
            const isWarn = budget.percentage >= 80 && budget.percentage <= 100;
            const barColor = isOver ? '#DC2626' : isWarn ? '#D97706' : '#16A34A';

            return (
              <div key={budget.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={{ ...styles.iconBox, backgroundColor: budget.category.color + '22' }}>
                    <span style={styles.iconEmoji}>{ICONS[budget.category.icon] || '💰'}</span>
                  </div>
                  <div style={styles.cardActions}>
                    <button style={styles.btnEdit} onClick={() => handleEdit(budget)}>Edit</button>
                    <button style={styles.btnRemove} onClick={() => handleDelete(budget.id)}>Delete</button>
                  </div>
                </div>

                <div style={styles.catName}>{budget.category.name}</div>

                <div style={styles.amountsRow}>
                  <span style={styles.spentAmount}>
                    {Number(budget.spent).toFixed(2)} €
                  </span>
                  <span style={styles.limitAmount}>
                    / {Number(budget.monthly_limit).toFixed(2)} €
                  </span>
                </div>

                <div style={styles.progressBg}>
                  <div style={{ ...styles.progressBar, width: `${pct}%`, backgroundColor: barColor }} />
                </div>

                <div style={styles.bottomRow}>
                  <span style={{ ...styles.pctLabel, color: barColor }}>
                    {budget.percentage}%
                  </span>
                  {isOver ? (
                    <span style={styles.alertOver}>
                      ⚠️ Over budget by {Math.abs(budget.remaining).toFixed(2)} €
                    </span>
                  ) : isWarn ? (
                    <span style={styles.alertWarn}>
                      ⚠️ {budget.remaining.toFixed(2)} € left this month
                    </span>
                  ) : (
                    <span style={styles.alertOk}>
                      {budget.remaining.toFixed(2)} € left this month
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <BudgetModal
          budget={editBudget}
          categories={categoriesWithoutBudget}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function BudgetModal({ budget, categories, onClose, onSaved }) {
  const [categoryId, setCategoryId] = useState(budget?.category?.id || '');
  const [monthlyLimit, setMonthlyLimit] = useState(budget?.monthly_limit || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (budget) {
        await updateBudget(budget.id, parseFloat(monthlyLimit));
      } else {
        await createBudget(parseInt(categoryId), parseFloat(monthlyLimit));
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>
          {budget ? 'Edit budget' : 'New budget'}
        </h2>
        <p style={styles.modalSubtitle}>
          {budget
            ? `Update the monthly limit for ${budget.category.name}`
            : 'Set a monthly spending limit for a category'}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!budget && (
            <div style={styles.field}>
              <label style={styles.label}>CATEGORY</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                style={styles.input}
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>MONTHLY LIMIT €</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={monthlyLimit}
              onChange={e => setMonthlyLimit(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" style={styles.btnSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save budget'}
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
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
  },
  btnAdd: {
    backgroundColor: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '11px 22px',
    fontWeight: '700',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    boxShadow: '0 10px 24px -8px rgba(37,99,235,0.4)',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--color-text-light)',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
    padding: '60px 40px',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    lineHeight: '1.6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '22px',
    fontFamily: 'Inter, sans-serif',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
  },
  cardActions: {
    display: 'flex',
    gap: '6px',
  },
  btnEdit: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-light)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '10px',
    padding: '7px 14px',
    fontSize: '12px',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
  },
  btnRemove: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: 'none',
    borderRadius: '10px',
    padding: '7px 14px',
    fontSize: '12px',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
  },
  catName: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--color-text)',
    marginBottom: '10px',
  },
  amountsRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    marginBottom: '10px',
  },
  spentAmount: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
  },
  limitAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-text-light)',
  },
  progressBg: {
    height: '8px',
    borderRadius: '999px',
    backgroundColor: 'var(--color-bg-soft)',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressBar: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.3s',
  },
  bottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pctLabel: {
    fontSize: '13px',
    fontWeight: '800',
  },
  alertOk: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-text-light)',
  },
  alertWarn: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#D97706',
  },
  alertOver: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#DC2626',
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
    maxWidth: '440px',
    boxShadow: '0 20px 60px -20px rgba(11,30,61,0.3)',
    fontFamily: 'Inter, sans-serif',
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
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
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
    fontFamily: 'Inter, sans-serif',
    color: 'var(--color-text)',
    outline: 'none',
    width: '100%',
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
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    boxShadow: '0 10px 24px -8px rgba(37,99,235,0.4)',
  },
};