import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Pending = lazy(() => import('./pages/Pending'));
const Operations = lazy(() => import('./pages/Operations'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'var(--color-bg)',
      fontSize: '14px',
      color: 'var(--color-text-light)',
      fontFamily: 'Montserrat, sans-serif',
    }}>
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/pending" element={<Pending />} />
            <Route path="/operations" element={<Operations />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </ThemeProvider>
  );
}