import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles?.includes('ROLE_ADMIN');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Si l'utilisateur est admin, le rediriger vers le portail admin
  if (isAdmin) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return children;
}