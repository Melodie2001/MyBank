import { useIsMobile } from '../hooks/useIsMobile';

export default function OperationCard({ operation, onDelete, onEdit }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ ...styles.row, gridTemplateColumns: isMobile ? 'minmax(0, 1fr) auto' : 'minmax(0, 2fr) repeat(3, minmax(0, 1fr)) 120px' }}>
      <span style={styles.label}>{operation.label}</span>
      <span style={{ ...styles.col, ...(isMobile ? { display: 'none' } : {}) }}>
        <span style={{
          ...styles.badge,
          backgroundColor: operation.category.color + '22',
          color: operation.category.color
        }}>
          {operation.category.name}
        </span>
      </span>
      <span style={{ ...styles.col, ...(isMobile ? { display: 'none' } : {}) }}>{operation.date}</span>
      <span style={{
        ...styles.col,
        fontWeight: '600',
        color: operation.type === 'income' ? '#00C49A' : '#ef4444'
      }}>
        {operation.type === 'income' ? '+' : '-'}{Number(operation.amount).toFixed(2)} €
      </span>
      <span style={{ ...styles.actions, ...(isMobile ? { gridColumn: '1 / -1', justifyContent: 'flex-end' } : {}) }}>
        <button style={styles.btnEdit} onClick={() => onEdit(operation)}>Edit</button>
        <button style={styles.btnDelete} onClick={() => onDelete(operation.id)}>Delete</button>
      </span>
    </div>
  );
}

const styles = {
  row: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
    padding: '12px 0',
    borderBottom: '1px solid var(--color-bg-soft)',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    minWidth: 0,
    overflowWrap: 'anywhere',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--color-text)',
  },
  col: {
    minWidth: 0,
    overflowWrap: 'anywhere',
    fontSize: '13px',
    color: 'var(--color-text)',
  },
  badge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    minWidth: 0,
    gap: '6px',
  },
  btnEdit: {
    backgroundColor: 'var(--color-bg-soft)',
    color: 'var(--color-text)',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  btnDelete: {
    backgroundColor: '#fde8e8',
    color: '#ef4444',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};
