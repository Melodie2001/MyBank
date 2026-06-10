import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getOperations, deleteOperation } from '../services/operationService';
import { getCategories, addToMyCategories } from '../services/categoryService';
import OperationCard from '../components/OperationCard';

export default function Operations() {
  const [operations, setOperations] = useState([]);
  const [categories, setCategories] = useState([]);
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
      const [ops, cats] = await Promise.all([
        getOperations(),
        getCategories()
      ]);
      setOperations(ops);
      setCategories(cats);
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
          operation={editOperation}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function OperationModal({ categories, operation, onClose, onSaved }) {
  const [label, setLabel] = useState(operation?.label || '');
  const [amount, setAmount] = useState(operation?.amount || '');
  const [date, setDate] = useState(operation?.date || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState(operation?.type || 'expense');
  const [categoryId, setCategoryId] = useState(operation?.category?.id || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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

        // Ajouter automatiquement la catégorie dans user_category
        try {
          await addToMyCategories(parseInt(categoryId));
        } catch (err) {
          if (err.response?.status !== 409) {
            console.error(err);
          }
        }
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
          {operation ? 'Edit Operation' : 'New Operation'}
        </h2>
        <p style={styles.modalSubtitle}>Fill in the details below to add an entry</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>LABEL</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>AMOUNT €</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>DATE</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>TYPE</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              style={styles.input}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

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

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>
              Cancel
            </button>
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
    color: '#6b7280',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
  },
  btnAdd: {
    backgroundColor: '#00C49A',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
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
  },
  filterBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6b7280',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#00C49A',
    color: '#fff',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '8px 12px',
    flex: 1,
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '13px',
    flex: 1,
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
    marginBottom: '8px',
  },
  col: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: '0.05em',
  },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    padding: '40px 0',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  modalSubtitle: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '24px',
  },
  error: {
    backgroundColor: '#fde8e8',
    color: '#ef4444',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
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
    fontWeight: '600',
    color: '#374151',
    letterSpacing: '0.05em',
  },
  input: {
    backgroundColor: '#e5e9e8',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '14px',
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
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '500',
    fontSize: '13px',
    cursor: 'pointer',
  },
  btnSave: {
    backgroundColor: '#00C49A',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
};