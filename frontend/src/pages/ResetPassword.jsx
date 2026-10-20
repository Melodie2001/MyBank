import Icon from '../components/Icon';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';

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
    fontFamily: 'Inter, sans-serif',
  }}>
    N
  </div>
);

// Même règle de complexité que le backend (App\DTO\ResetPasswordDTO) :
// au moins 8 caractères, une majuscule, une minuscule, un chiffre, un caractère spécial.
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is invalid or has expired');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!PASSWORD_RULE.test(newPassword)) {
      setError('Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a digit and a special character');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      navigate('/login', { state: { message: 'Your password has been reset. You can now sign in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <Link to="/" style={styles.backHome}>← Back to home</Link>
      <div style={styles.container}>
        <div style={styles.logo}>
          <LogoIcon />
          <span>
            <span style={{ color: 'var(--color-text)', fontWeight: '700' }}>Nexo</span>
            <span style={{ color: '#2563EB', fontWeight: '700' }}> Finance</span>
          </span>
        </div>

        <h2 style={styles.title}>Choose a new password</h2>
        <p style={styles.subtitle}>Make sure it's strong and unique to your Nexo Finance account.</p>

        {!token && (
          <div role="alert" style={styles.error}>This reset link is invalid or has expired. Please request a new one.</div>
        )}
        {error && <div role="alert" style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="reset-new-password" style={styles.label}>NEW PASSWORD</label>
            <div style={styles.inputWrapper}>
              <input
                id="reset-new-password"
                autoComplete="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>
          </div>

          <div style={styles.field}>
            <label htmlFor="reset-confirm-password" style={styles.label}>CONFIRM PASSWORD</label>
            <input
              id="reset-confirm-password"
              autoComplete="new-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" style={styles.btnPrimary} disabled={loading || !token}>
            {loading ? 'Resetting...' : 'Reset password →'}
          </button>
        </form>

        <p style={styles.switchText}>
          <Link to="/login" style={styles.link}>Back to sign in</Link>
        </p>
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
    fontFamily: 'Inter, sans-serif',
    position: 'relative',
  },
  container: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: 'var(--color-white)',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(11,30,61,0.15)',
    padding: '40px 32px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '28px',
    fontSize: '19px',
    fontWeight: '700',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    marginBottom: '8px',
    color: 'var(--color-text)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-light)',
    marginBottom: '28px',
    fontWeight: '500',
    lineHeight: 1.6,
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
  input: {
    backgroundColor: 'var(--color-input-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: '13px 14px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
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
  backHome: {
    position: 'absolute',
    top: '20px',
    left: '24px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#2563EB',
    textDecoration: 'none',
    fontFamily: 'Inter, sans-serif',
    zIndex: 10,
  },
};
