import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.logo}>
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
          }}>
            N
          </div>
          <span>
            <span style={{ color: 'var(--color-text)', fontWeight: '700' }}>Nexo</span>
            <span style={{ color: '#2563EB', fontWeight: '700' }}> Finance</span>
          </span>
        </div>

        <h1 style={styles.code}>404</h1>
        <h2 style={styles.title}>Page not found</h2>
        <p style={styles.subtitle}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link to="/dashboard" style={styles.btn}>
          Back to Dashboard
        </Link>
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
    fontFamily: 'Inter, sans-serif',
  },
  container: {
    textAlign: 'center',
    padding: '40px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '40px',
    fontSize: '21px',
    fontWeight: '700',
  },
  code: {
    fontSize: '96px',
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: '-2px',
    lineHeight: 1,
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    marginBottom: '32px',
  },
  btn: {
    display: 'inline-block',
    backgroundColor: '#2563EB',
    color: '#fff',
    borderRadius: '12px',
    padding: '13px 28px',
    fontWeight: '700',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    textDecoration: 'none',
    boxShadow: '0 10px 24px -8px rgba(37,99,235,0.4)',
  },
};