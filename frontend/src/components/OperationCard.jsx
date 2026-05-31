export default function OperationCard({ operation, onDelete, onEdit }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{operation.label}</span>
      <span style={styles.col}>
        <span style={{
          ...styles.badge,
          backgroundColor: operation.category.color + '22',
          color: operation.category.color
        }}>
          {operation.category.name}
        </span>
      </span>
      <span style={styles.col}>{operation.date}</span>
      <span style={{
        ...styles.col,
        fontWeight: '600',
        color: operation.type === 'income' ? '#00C49A' : '#ef4444'
      }}>
        {operation.type === 'income' ? '+' : '-'}{Number(operation.amount).toFixed(2)} €
      </span>
      <span style={styles.actions}>
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
    borderBottom: '1px solid #f9fafb',
    alignItems: 'center',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
  },
  col: {
    fontSize: '13px',
    color: '#374151',
  },
  badge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    gap: '6px',
  },
  btnEdit: {
    backgroundColor: '#e5e9e8',
    color: '#374151',
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