import { Children } from 'react';
export default function DataRow({ children, labels, style }) {
  return <div className="admin-data-row" style={style}>
    {Children.toArray(children).map((child, index) => <div className="admin-data-cell" key={labels[index]}>
      <span className="admin-cell-label">{labels[index]}</span>
      <div className="admin-cell-content">{child}</div>
    </div>)}
  </div>;
}
