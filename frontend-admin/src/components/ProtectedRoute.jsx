import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const isAdmin = user.roles?.includes('ROLE_ADMIN');

  if (!token || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}