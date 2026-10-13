import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeOAuthCode, logout } from '../services/authService';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const code = searchParams.get('code');

    async function finishLogin() {
      try {
        await exchangeOAuthCode(code);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        logout();
        navigate('/login', {
          state: {
            message:
              err?.response?.data?.message ||
              err.message ||
              'Google sign-in failed. Please try again.',
          }
        });
      }
    }

    if (code) {
      finishLogin();
    } else {
      navigate('/login', { state: { message: 'Google sign-in failed. Please try again.' } });
    }
  }, [searchParams, navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.spinner} />
      <p style={styles.text}>Signing you in…</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    backgroundColor: 'var(--color-bg)',
    fontFamily: 'Inter, sans-serif',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid var(--color-border)',
    borderTopColor: '#2563EB',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  text: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-text-light)',
  },
};
