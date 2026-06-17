import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Operations = lazy(() => import('./pages/Operations'));
const Categories = lazy(() => import('./pages/Categories'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'var(--color-bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: '#2563EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: '800',
          color: '#fff',
          fontFamily: 'Montserrat, sans-serif',
          margin: '0 auto 16px',
        }}>
          N
        </div>
        <div style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '14px', fontFamily: 'Montserrat, sans-serif' }}>Loading...</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
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
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Redirects */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </ThemeProvider>
  );
}