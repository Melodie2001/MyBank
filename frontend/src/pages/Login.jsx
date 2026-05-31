import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../services/authService';

const LogoIcon = () => (
  <div style={{
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#F8E16C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: 0,
  }}>
    🏦
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Left panel */}
        <div style={styles.left}>
          <div style={styles.logo}>
            <LogoIcon />
            <span>
              <span style={{ color: '#fff', fontWeight: '400' }}>my</span>
              <span style={{ color: '#00C49A', fontWeight: '700' }}>Bank</span>
            </span>
          </div>

          <div style={styles.leftContent}>
            <div style={styles.badge}>
              <span style={styles.badgeDot}/>
              Personal finance
            </div>

            <h1 style={styles.leftTitle}>
              Take control<br />of your <span style={{ color: '#F8E16C' }}>money</span>
            </h1>
            <p style={styles.leftSubtitle}>
              Track your expenses, manage your budget and understand where your money goes — all in one place.
            </p>

            <div style={styles.decoration}>
              <div style={styles.circle1} />
              <div style={styles.circle2} />
            </div>
          </div>

          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>📊</span>
              Visualize all your expenses at a glance
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🏷️</span>
              Organize by categories you define
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🔒</span>
              Secure and private — your data stays yours
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={styles.right}>
          <div style={styles.rightInner}>
            <h2 style={styles.rightTitle}>Welcome back 👋</h2>
            <p style={styles.rightSubtitle}>Sign in to manage your expenses</p>

            {successMessage && (
              <div style={styles.success}>{successMessage}</div>
            )}
            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>EMAIL ADDRESS</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>PASSWORD</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>🔑</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...styles.input, paddingRight: '40px' }}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={styles.rememberRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={styles.checkbox}
                  />
                  Remember me
                </label>
                <span style={styles.forgotLink}>Forgot password?</span>
              </div>

              <button type="submit" style={styles.btnPrimary} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>or continue with</span>
              <div style={styles.dividerLine} />
            </div>

            <button style={styles.btnGoogle}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p style={styles.switchText}>
              Don't have an account?{' '}
              <Link to="/register" style={styles.link}>Sign up</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0EF',
    padding: '20px',
  },
  container: {
    display: 'flex',
    width: '100%',
    maxWidth: '1000px',
    minHeight: '600px',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  left: {
    flex: 1,
    backgroundColor: '#156064',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '48px',
    position: 'relative',
    zIndex: 1,
    fontSize: '22px',
    fontWeight: '700',
  },
  leftContent: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid rgba(0,196,154,0.5)',
    color: '#00C49A',
    borderRadius: '20px',
    padding: '5px 14px',
    fontSize: '12px',
    marginBottom: '24px',
    backgroundColor: 'rgba(0,196,154,0.1)',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#00C49A',
    display: 'inline-block',
  },
  leftTitle: {
    fontSize: '36px',
    fontWeight: '700',
    lineHeight: 1.2,
    marginBottom: '16px',
  },
  leftSubtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.7,
  },
  decoration: {
    position: 'absolute',
    bottom: '-40px',
    right: '-40px',
  },
  circle1: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,196,154,0.1)',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  circle2: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,196,154,0.08)',
    position: 'absolute',
    bottom: '60px',
    right: '60px',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    position: 'relative',
    zIndex: 1,
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
  },
  featureIcon: {
    fontSize: '16px',
  },
  right: {
    flex: 1,
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
  },
  rightInner: {
    width: '100%',
    maxWidth: '380px',
  },
  rightTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '6px',
    color: '#1a1a1a',
  },
  rightSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '32px',
  },
  success: {
    backgroundColor: '#e6faf5',
    color: '#00C49A',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  error: {
    backgroundColor: '#fde8e8',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#374151',
    letterSpacing: '0.06em',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '14px',
    zIndex: 1,
  },
  input: {
    backgroundColor: '#f0f4f3',
    border: '2px solid transparent',
    borderRadius: '10px',
    padding: '13px 14px 13px 38px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
  },
  rememberRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#00C49A',
    width: '15px',
    height: '15px',
  },
  forgotLink: {
    fontSize: '13px',
    color: '#00C49A',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnPrimary: {
    backgroundColor: '#00C49A',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    fontWeight: '700',
    fontSize: '15px',
    marginTop: '4px',
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: '12px',
    color: '#9ca3af',
    whiteSpace: 'nowrap',
  },
  btnGoogle: {
    width: '100%',
    backgroundColor: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    padding: '13px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    color: '#374151',
    marginBottom: '24px',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#6b7280',
  },
  link: {
    color: '#00C49A',
    fontWeight: '700',
  },
};