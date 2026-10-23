import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const userLogin = `${(import.meta.env.VITE_USER_URL || 'https://nexo-finance.duckdns.org').replace(/\/$/, '')}/login`;

export default function Forbidden() {
  return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '24px', background: 'var(--color-bg)' }}>
    <section aria-labelledby="forbidden-title" style={{ width: '100%', maxWidth: '460px', padding: '32px 24px', borderRadius: '20px', background: 'var(--color-white)', color: 'var(--color-text)', textAlign: 'center', border: '1px solid var(--color-border)' }}>
      <Icon name="shield" size={36} />
      <p style={{ margin: '16px 0 8px', fontSize: '36px', fontWeight: 800 }}>403</p>
      <h1 id="forbidden-title">Access denied</h1>
      <p style={{ margin: '16px 0 24px', color: 'var(--color-text-light)', lineHeight: 1.6 }}>This area is reserved for administrators.</p>
      <a href={userLogin} style={{ display: 'block', padding: '14px', background: '#2563EB', borderRadius: '10px', color: 'white', fontWeight: 700 }}>Go to user login</a>
      <Link to="/login" style={{ display: 'inline-block', marginTop: '20px', color: 'var(--color-accent)' }}>Back to admin login</Link>
    </section>
  </main>;
}
