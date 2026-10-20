import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';

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

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      // Report delivery failures without revealing whether an account exists.
      setError(err.response?.status === 429
        ? 'Too many requests. Please wait before trying again.'
        : 'Unable to request a reset link. Please try again.');
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

        {submitted ? (
          <>
            <h2 style={styles.title}>Check your inbox</h2>
            <p style={styles.subtitle}>
              If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
              The link is valid for 1 hour.
            </p>
            <Link to="/login" style={styles.btnSecondary}>Back to sign in</Link>
          </>
        ) : (
          <>
            <h2 style={styles.title}>Forgot your password?</h2>
            <p style={styles.subtitle}>Enter your email and we'll send you a reset link.</p>

            {error && <div role="alert" style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label htmlFor="reset-email" style={styles.label}>EMAIL ADDRESS</label>
                <input
                  id="reset-email"
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <button type="submit" style={styles.btnPrimary} disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link →'}
              </button>
            </form>

            <p style={styles.switchText}>
              Remembered your password?{' '}
              <Link to="/login" style={styles.link}>Sign in</Link>
            </p>
          </>
        )}
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
  btnSecondary: {
    display: 'block',
    textAlign: 'center',
    backgroundColor: 'var(--color-input-bg)',
    color: 'var(--color-text)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: '15px',
    fontWeight: '700',
    fontSize: '15px',
    fontFamily: 'Inter, sans-serif',
    textDecoration: 'none',
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
