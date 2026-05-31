import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import './styles/global.css';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Operations = lazy(() => import('./pages/Operations'));
const Categories = lazy(() => import('./pages/Categories'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#E8F0EF',
    }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 36 36" fill="none" style={{ marginBottom: '16px' }}>
          <rect width="36" height="36" rx="8" fill="#F8E16C"/>
          <path d="M8 27v-2h2V13H8v-2h9c3.3 0 6 2.7 6 6s-2.7 6-6 6h-5v2h2v2H8zm6-8h3c1.7 0 3-1.3 3-3s-1.3-3-3-3h-3v6z" fill="#156064"/>
          <path d="M24 13h2l4 4-4 4h-2v-3h-4v-2h4v-3z" fill="#156064"/>
        </svg>
        <div style={{ color: '#156064', fontWeight: '600', fontSize: '14px' }}>Loading...</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/categories" element={<Categories />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}