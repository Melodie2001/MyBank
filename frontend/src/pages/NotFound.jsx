import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.logo}>
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
          <span>
            <span style={{ color: '#156064', fontWeight: '400' }}>my</span>
            <span style={{ color: '#00C49A', fontWeight: '700' }}>Bank</span>
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
    backgroundColor: '#E8F0EF',
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
    fontSize: '22px',
    fontWeight: '700',
  },
  code: {
    fontSize: '96px',
    fontWeight: '700',
    color: '#00C49A',
    lineHeight: 1,
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '32px',
  },
  btn: {
    display: 'inline-block',
    backgroundColor: '#00C49A',
    color: '#fff',
    borderRadius: '8px',
    padding: '12px 28px',
    fontWeight: '600',
    fontSize: '14px',
    textDecoration: 'none',
  },
};