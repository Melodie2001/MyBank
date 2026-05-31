import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { getOperations } from '../services/operationService';

const ICONS = [
  { id: 'house.png', emoji: '🏠' },
  { id: 'train.png', emoji: '🚆' },
  { id: 'healthcare.png', emoji: '❤️' },
  { id: 'books.png', emoji: '📚' },
  { id: 'plane.png', emoji: '✈️' },
  { id: 'dog.png', emoji: '🐾' },
  { id: 'briefcase.png', emoji: '💼' },
  { id: 'gamepad.png', emoji: '🎮' },
  { id: 'burger.png', emoji: '🍔' },
  { id: 'pills.png', emoji: '💊' },
  { id: 'entertainment.png', emoji: '🎬' },
  { id: 'cart.png', emoji: '🛒' },
  { id: 'admin-test.png', emoji: '⚙️' },
];

const COLORS = [
  '#00C49A',
  '#156064',
  '#F8E16C',
  '#ef4444',
  '#8b5cf6',
  '#f97316',
];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
  try {
    const [cats, ops] = await Promise.all([
      getCategories(),
      getOperations()
    ]);
    setOperations(ops);
    // Garder uniquement les catégories qui ont au moins une opération
    const activeCatIds = new Set(ops.map(op => op.category.id));
    setCategories(cats.filter(cat => activeCatIds.has(cat.id)));
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}
  

  function getCategoryStats(catId) {
    const catOps = operations.filter(op => op.category.id === catId);
    const total = catOps.reduce((sum, op) => sum + Number(op.amount), 0);
    return { count: catOps.length, total };
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete this category');
    }
  }

  function handleEdit(cat) {
    setEditCategory(cat);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setEditCategory(null);
  }

  async function handleSaved() {
    handleModalClose();
    await fetchData();
  }

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Categories</h1>
          <p style={styles.subtitle}>Manage your expense categories</p>
        </div>
        <button style={styles.btnAdd} onClick={() => setShowModal(true)}>
          + Add category
        </button>
      </div>

      {categories.length === 0 ? (
        <div style={styles.empty}>No categories yet. Create your first one!</div>
      ) : (
        <div style={styles.grid}>
          {categories.map(cat => {
            const { count, total } = getCategoryStats(cat.id);
            return (
              <div key={cat.id} style={styles.card}>
                <div style={{
                  ...styles.iconBox,
                  backgroundColor: cat.color + '22',
                }}>
                  <span style={styles.iconEmoji}>
                    {ICONS.find(i => i.id === cat.icon)?.emoji || '💰'}
                  </span>
                </div>
                <div style={styles.catName}>{cat.name}</div>
                <div style={styles.catOps}>
                  {count} {count === 1 ? 'operation' : 'operations'}
                </div>
                <div style={styles.catTotal}>
                  €{total.toFixed(2)}
                </div>
                <div style={styles.cardActions}>
                  <button style={styles.btnEdit} onClick={() => handleEdit(cat)}>Edit</button>
                  <button style={styles.btnDelete} onClick={() => handleDelete(cat.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CategoryModal
          category={editCategory}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function CategoryModal({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || ICONS[0].id);
  const [color, setColor] = useState(category?.color || COLORS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const previewEmoji = ICONS.find(i => i.id === icon)?.emoji || '💰';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = { name, icon, color };
      if (category) {
        await updateCategory(category.id, data);
      } else {
        await createCategory(data);
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
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>
              {category ? 'Edit category' : 'New category'}
            </h2>
            <p style={styles.modalSubtitle}>
              Give your category a name, icon and color
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>CATEGORY NAME</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={styles.input}
              placeholder="e.g. Groceries, Rent, Sport..."
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>ICON</label>
            <div style={styles.iconsGrid}>
              {ICONS.map(ic => (
                <button
                  key={ic.id}
                  type="button"
                  onClick={() => setIcon(ic.id)}
                  style={{
                    ...styles.iconBtn,
                    ...(icon === ic.id ? styles.iconBtnActive : {})
                  }}
                >
                  {ic.emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>COLOR</label>
            <div style={styles.colorsRow}>
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    ...styles.colorBtn,
                    backgroundColor: c,
                    ...(color === c ? styles.colorBtnActive : {})
                  }}
                />
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>PREVIEW</label>
            <div style={styles.preview}>
              <div style={{
                ...styles.previewIcon,
                backgroundColor: color + '22',
              }}>
                <span style={{ fontSize: '20px' }}>{previewEmoji}</span>
              </div>
              <span style={styles.previewName}>{name || 'Category name'}</span>
            </div>
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" style={styles.btnSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save category'}
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
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#6b7280',
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
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px',
    padding: '60px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px 20px 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  iconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  iconEmoji: {
    fontSize: '24px',
  },
  catName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  catOps: {
    fontSize: '12px',
    color: '#6b7280',
  },
  catTotal: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: '4px',
    marginBottom: '8px',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  btnEdit: {
    flex: 1,
    backgroundColor: '#e5e9e8',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 0',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  btnDelete: {
    flex: 1,
    backgroundColor: '#fde8e8',
    color: '#ef4444',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 0',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
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
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  modalSubtitle: {
    fontSize: '13px',
    color: '#6b7280',
  },
  closeBtn: {
    background: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#6b7280',
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
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
  iconsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '8px',
  },
  iconBtn: {
    backgroundColor: '#f3f4f6',
    border: '2px solid transparent',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '18px',
    cursor: 'pointer',
  },
  iconBtnActive: {
    border: '2px solid #00C49A',
    backgroundColor: '#e6faf5',
  },
  colorsRow: {
    display: 'flex',
    gap: '10px',
  },
  colorBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '2px solid transparent',
    cursor: 'pointer',
  },
  colorBtnActive: {
    border: '2px solid #1a1a1a',
    transform: 'scale(1.15)',
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '12px',
  },
  previewIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
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