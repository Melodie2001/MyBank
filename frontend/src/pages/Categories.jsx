import { useState, useEffect } from 'react';
import { getCategories, getMyCategories, addToMyCategories, removeFromMyCategories } from '../services/categoryService';
import { getOperations } from '../services/operationService';

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
};

export default function Categories() {
  const [myCategories, setMyCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [mine, all, ops] = await Promise.all([
        getMyCategories(),
        getCategories(),
        getOperations()
      ]);
      setMyCategories(mine);
      setAllCategories(all);
      setOperations(ops);
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

  async function handleAdd(categoryId) {
    try {
      await addToMyCategories(categoryId);
      await fetchData();
      setShowModal(false);
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

      {myCategories.length === 0 ? (
        <div style={styles.empty}>
          No categories yet. Click "+ Add category" to add one.
        </div>
      ) : (
        <div style={styles.grid}>
          {myCategories.map(cat => {
            const { count, total } = getCategoryStats(cat.id);
            return (
              <div key={cat.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={{
                    ...styles.iconBox,
                    backgroundColor: cat.color + '22',
                  }}>
                    <span style={styles.iconEmoji}>
                      {ICONS[cat.icon] || '💰'}
                    </span>
                  </div>
                  <div style={{
                    ...styles.colorDot,
                    backgroundColor: cat.color
                  }} />
                </div>
                <div style={styles.catName}>{cat.name}</div>
                <div style={styles.catOps}>
                  {count} {count === 1 ? 'operation' : 'operations'}
                </div>
                <div style={styles.catTotal}>
                  €{total.toFixed(2)}
                </div>
                <div style={styles.cardActions}>
                  <button
                    style={styles.btnRemove}
                    onClick={() => handleRemove(cat.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <SelectCategoryModal
          categories={availableCategories}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}

function SelectCategoryModal({ categories, onClose, onAdd }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Add a category</h2>
            <p style={styles.modalSubtitle}>Select a category to add to your list</p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {categories.length === 0 ? (
          <div style={styles.emptyModal}>
            All available categories are already in your list.
          </div>
        ) : (
          <div style={styles.categoriesGrid}>
            {categories.map(cat => (
              <div
                key={cat.id}
                style={styles.categoryOption}
                onClick={() => onAdd(cat.id)}
              >
                <div style={{
                  ...styles.optionIcon,
                  backgroundColor: cat.color + '22',
                }}>
                  <span style={{ fontSize: '24px' }}>
                    {ICONS[cat.icon] || '💰'}
                  </span>
                </div>
                <span style={styles.optionName}>{cat.name}</span>
                <div style={{
                  ...styles.optionDot,
                  backgroundColor: cat.color
                }} />
              </div>
            ))}
          </div>
        )}

        <div style={styles.modalActions}>
          <button onClick={onClose} style={styles.btnCancel}>Cancel</button>
        </div>
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
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
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
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  iconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: '24px',
  },
  colorDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
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
  btnRemove: {
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
    maxWidth: '500px',
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
  emptyModal: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    padding: '24px 0',
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  categoryOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 12px',
    borderRadius: '10px',
    border: '2px solid #f3f4f6',
    cursor: 'pointer',
    position: 'relative',
  },
  optionIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  optionDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
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
};