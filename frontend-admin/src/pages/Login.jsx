import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const navigate = useNavigate();
  const { dark, toggleDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.gridDots} />
      <div style={styles.cornerShape} />

      <button onClick={toggleDark} style={styles.themeBtn} title={dark ? 'Light mode' : 'Dark mode'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {dark
            ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
            : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          }
        </svg>
      </button>

      <div style={styles.container}>
        <div style={styles.shield}>🛡️</div>

        <div style={styles.logoWrapper}>
          <div style={styles.logoIcon}>N</div>
          <span style={styles.logoText}>Nexo Finance</span>
          <span style={styles.adminBadge}>ADMIN</span>
        </div>

        <h1 style={styles.title}>Admin Portal</h1>
        <p style={styles.subtitle}>Sign in to access the administration panel</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>EMAIL ADDRESS</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📧</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={styles.input}
                placeholder="admin@example.com"
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
                onChange={e => setPassword(e.target.value)}
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

          <button type="submit" style={styles.btnPrimary} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in to Admin Panel'}
          </button>
        </form>
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
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'Montserrat, sans-serif',
  },
  gridDots: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle, rgba(11,30,61,0.04) 1.5px, transparent 1.5px)',
    backgroundSize: '28px 28px',
  },
  cornerShape: {
    position: 'absolute',
    top: '-120px',
    right: '-120px',
    width: '360px',
    height: '360px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-bg-soft)',
  },
  container: {
    backgroundColor: 'var(--color-white)',
    borderRadius: '20px',
    padding: '44px',
    width: '100%',
    maxWidth: '460px',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-card)',
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
  },
  shield: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: 'var(--color-bg-soft)',
    color: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    margin: '0 auto 18px',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  logoIcon: {
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
  },
  logoText: {
    fontSize: '21px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
  },
  adminBadge: {
    backgroundColor: '#0B1E3D',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '800',
    padding: '5px 10px',
    borderRadius: '8px',
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    textAlign: 'center',
    margin: '28px 0 6px',
    color: 'var(--color-text)',
  },
  subtitle: {
    fontSize: '13.5px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: '28px',
  },
  error: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '16px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    textAlign: 'left',
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
  btnPrimary: {
    backgroundColor: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '15px',
    fontWeight: '700',
    fontSize: '15px',
    fontFamily: 'Montserrat, sans-serif',
    marginTop: '8px',
    cursor: 'pointer',
  },
  themeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--color-text)',
    zIndex: 2,
  },
};