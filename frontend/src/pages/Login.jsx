import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../services/authService';
import { useIsMobile } from '../hooks/useIsMobile';

const LogoIcon = () => (
  <div style={{
    width: '40px',
    height: '40px',
    borderRadius: '11px',
    backgroundColor: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '800',
    color: '#fff',
    flexShrink: 0,
    fontFamily: 'Montserrat, sans-serif',
  }}>
    N
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const isMobile = useIsMobile();
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
    <div style={{ ...styles.page, ...(isMobile ? { padding: 0 } : {}) }}>
      <div style={{ ...styles.container, ...(isMobile ? { flexDirection: 'column', borderRadius: 0, boxShadow: 'none', maxWidth: '100%', minHeight: '100vh' } : {}) }}>

        {/* Left panel */}
        <div style={{ ...styles.left, ...(isMobile ? { display: 'none' } : {}) }}>
          {/* Background decoration: dot grid + concentric rings */}
          <div style={styles.dotGrid} />
          <div style={styles.ring1} />
          <div style={styles.ring2} />
          <div style={styles.accentBlob} />

          <div style={styles.logo}>
            <LogoIcon />
            <span>
              <span style={{ color: '#fff', fontWeight: '700' }}>Nexo</span>
              <span style={{ color: '#7DA8FF', fontWeight: '700' }}> Finance</span>
            </span>
          </div>

          <div style={styles.leftContent}>
            <div style={styles.badge}>
              <span style={styles.badgeDot}/>
              Personal finance
            </div>

            <h1 style={styles.leftTitle}>
              Take control<br />of your <span style={{ color: '#2563EB' }}>money</span>
            </h1>
            <p style={styles.leftSubtitle}>
              Track your expenses, manage your budget and understand where your money goes — all in one place.
            </p>
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
        <div style={{ ...styles.right, ...(isMobile ? { padding: '40px 24px', flex: 1 } : {}) }}>
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
              </div>

              <button type="submit" style={styles.btnPrimary} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

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
    backgroundColor: 'var(--color-bg)',
    padding: '20px',
    fontFamily: 'Montserrat, sans-serif',
  },
  container: {
    display: 'flex',
    width: '100%',
    maxWidth: '1000px',
    minHeight: '600px',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(11,30,61,0.15)',
  },
  left: {
    flex: 1,
    backgroundColor: '#0B1E3D',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },

  dotGrid: {
    position: 'absolute',
    top: '40px',
    right: '40px',
    width: '160px',
    height: '160px',
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1.5px, transparent 1.5px)',
    backgroundSize: '18px 18px',
    zIndex: 0,
  },
  ring1: {
    position: 'absolute',
    bottom: '120px',
    right: '-60px',
    width: '220px',
    height: '220px',
    border: '1.5px solid rgba(255,255,255,0.08)',
    borderRadius: '50%',
    zIndex: 0,
  },
  ring2: {
    position: 'absolute',
    bottom: '80px',
    right: '0px',
    width: '150px',
    height: '150px',
    border: '1.5px solid rgba(255,255,255,0.06)',
    borderRadius: '50%',
    zIndex: 0,
  },
  accentBlob: {
    position: 'absolute',
    bottom: '-100px',
    right: '-100px',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    backgroundColor: 'rgba(37,99,235,0.25)',
    zIndex: 0,
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '48px',
    position: 'relative',
    zIndex: 1,
    fontSize: '21px',
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
    border: '1px solid rgba(37,99,235,0.4)',
    color: '#7DA8FF',
    borderRadius: '20px',
    padding: '5px 14px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    marginBottom: '24px',
    backgroundColor: 'rgba(37,99,235,0.15)',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    display: 'inline-block',
  },
  leftTitle: {
    fontSize: '36px',
    fontWeight: '800',
    letterSpacing: '-1px',
    lineHeight: 1.2,
    marginBottom: '16px',
  },
  leftSubtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.7,
    maxWidth: '340px',
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
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  featureIcon: {
    fontSize: '16px',
  },
  right: {
    flex: 1,
    backgroundColor: 'var(--color-white)',
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
    fontWeight: '800',
    letterSpacing: '-0.5px',
    marginBottom: '6px',
    color: 'var(--color-text)',
  },
  rightSubtitle: {
    fontSize: '14px',
    color: 'var(--color-text-light)',
    marginBottom: '32px',
    fontWeight: '500',
  },
  success: {
    backgroundColor: '#ECFDF5',
    color: '#16A34A',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  error: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
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
    color: 'var(--color-text-light)',
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
    backgroundColor: 'var(--color-input-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: '13px 14px 13px 38px',
    fontSize: '14px',
    fontFamily: 'Montserrat, sans-serif',
    color: 'var(--color-text)',
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
    fontWeight: '600',
    color: 'var(--color-text-light)',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#2563EB',
    width: '15px',
    height: '15px',
  },
  forgotLink: {
    fontSize: '13px',
    color: '#2563EB',
    fontWeight: '700',
    cursor: 'pointer',
  },
  btnPrimary: {
    backgroundColor: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '15px',
    fontWeight: '700',
    fontSize: '15px',
    fontFamily: 'Montserrat, sans-serif',
    marginTop: '4px',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    boxShadow: '0 10px 24px -8px rgba(37,99,235,0.4)',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    marginTop: '24px',
  },
  link: {
    color: '#2563EB',
    fontWeight: '700',
  },
};