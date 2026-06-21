import { Link } from 'react-router-dom';

function Section({ icon, title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        <span style={s.sectionIcon}>{icon}</span>
        <h2 style={s.sectionTitle}>{title}</h2>
      </div>
      <div style={s.sectionBody}>{children}</div>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div style={s.dataRow}>
      <span style={s.dataLabel}>{label}</span>
      <span style={s.dataValue}>{value}</span>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <div style={s.logo}>
          <div style={s.logoIcon}>N</div>
          <span style={s.logoText}>Nexo Finance</span>
        </div>
        <Link to="/register" style={s.backLink}>← Back to register</Link>
      </div>

      <div style={s.container}>
        {/* Hero */}
        <div style={s.hero}>
          <div style={s.heroBadge}>Legal</div>
          <h1 style={s.heroTitle}>Privacy Policy</h1>
          <p style={s.heroSub}>
            Last updated: June 20, 2026 · Nexo Finance is committed to protecting your personal data.
            This policy explains what we collect, why, and how you can control it.
          </p>
        </div>

        {/* Quick summary cards */}
        <div style={s.summaryGrid}>
          {[
            { icon: '🔒', label: 'Passwords hashed', desc: 'Never stored in plain text' },
            { icon: '🔑', label: 'JWT secured', desc: 'Sessions protected by signed tokens' },
            { icon: '🚫', label: 'No third-party sharing', desc: 'Your data stays within Nexo Finance' },
            { icon: '🗑️', label: 'Right to deletion', desc: 'Delete your account anytime' },
          ].map(item => (
            <div key={item.label} style={s.summaryCard}>
              <span style={s.summaryIcon}>{item.icon}</span>
              <div style={s.summaryLabel}>{item.label}</div>
              <div style={s.summaryDesc}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <Section icon="📋" title="1. Data we collect">
          <p style={s.p}>
            When you create an account and use Nexo Finance, we collect the following personal data:
          </p>
          <div style={s.dataGrid}>
            <DataRow label="Email address" value="Required — used to log in and identify your account" />
            <DataRow label="First name & last name" value="Required — used to personalise your experience" />
            <DataRow label="Password" value="Required — stored as a bcrypt hash, never in plain text" />
            <DataRow label="Phone number" value="Optional — displayed on your profile" />
            <DataRow label="Date of birth" value="Optional — displayed on your profile" />
            <DataRow label="Gender" value="Optional — displayed on your profile" />
            <DataRow label="Financial operations" value="Income and expense entries you create (label, amount, date, type, category)" />
            <DataRow label="Categories" value="Expense/income categories you add to your account" />
            <DataRow label="Budgets" value="Monthly spending limits you set per category" />
            <DataRow label="Notifications" value="System alerts related to your budget usage and operations" />
          </div>
        </Section>

        <Section icon="🎯" title="2. Why we collect this data">
          <p style={s.p}>
            We only collect what is strictly necessary to provide the Nexo Finance service. Each piece of data serves a specific purpose:
          </p>
          <ul style={s.list}>
            <li style={s.listItem}><strong>Account data</strong> (email, name, password) — enables secure authentication and account identification.</li>
            <li style={s.listItem}><strong>Profile data</strong> (phone, birth date, gender) — personalises your profile display. Entirely optional.</li>
            <li style={s.listItem}><strong>Financial data</strong> (operations, categories, budgets) — powers the dashboard, spending charts, and budget alerts that make Nexo Finance useful.</li>
            <li style={s.listItem}><strong>Activity logs</strong> — stored in a separate database (MongoDB) for auditing and debugging purposes. Logs record actions such as account creation, operation changes, and profile updates.</li>
          </ul>
          <p style={s.p}>We do not use your data for advertising, profiling, or any purpose beyond operating the service.</p>
        </Section>

        <Section icon="🛡️" title="3. How your data is protected">
          <p style={s.p}>We take several technical measures to protect your data:</p>
          <ul style={s.list}>
            <li style={s.listItem}>
              <strong>Passwords</strong> — hashed using the <code style={s.code}>bcrypt</code> algorithm before being stored. Even Nexo Finance staff cannot see your password.
            </li>
            <li style={s.listItem}>
              <strong>Authentication</strong> — managed via JWT (JSON Web Tokens) signed with a private key. Tokens expire automatically and are stored only in your browser's local storage.
            </li>
            <li style={s.listItem}>
              <strong>Data isolation</strong> — each user can only access their own data. All API endpoints enforce ownership checks.
            </li>
            <li style={s.listItem}>
              <strong>No plain-text sensitive data</strong> — financial operations are stored in a relational database accessible only through authenticated and authorised API calls.
            </li>
            <li style={s.listItem}>
              <strong>Admin access</strong> — administrators have a separate portal and cannot access your financial data through the standard user interface.
            </li>
          </ul>
        </Section>

        <Section icon="⏳" title="4. Data retention">
          <p style={s.p}>
            Your data is retained for as long as your account is active. Specifically:
          </p>
          <ul style={s.list}>
            <li style={s.listItem}><strong>Account data</strong> — kept until you delete your account.</li>
            <li style={s.listItem}><strong>Financial data</strong> (operations, budgets, categories) — deleted immediately and permanently when you delete your account.</li>
            <li style={s.listItem}><strong>Activity logs</strong> (MongoDB) — may be retained for a short period after account deletion for security and audit purposes.</li>
          </ul>
          <p style={s.p}>
            We do not sell, rent, or share your data with third parties. Your data is not used for any purpose beyond operating Nexo Finance.
          </p>
        </Section>

        <Section icon="🗑️" title="5. How to delete your account">
          <p style={s.p}>
            You have the right to delete your account and all associated data at any time. When you delete your account:
          </p>
          <ul style={s.list}>
            <li style={s.listItem}>All your financial operations are permanently deleted.</li>
            <li style={s.listItem}>All your budgets and categories are permanently deleted.</li>
            <li style={s.listItem}>All your notifications are permanently deleted.</li>
            <li style={s.listItem}>Your account credentials are permanently removed.</li>
          </ul>
          <div style={s.deleteTip}>
            <span style={s.deleteTipIcon}>💡</span>
            <span>
              To delete your account, go to <strong>Profile → Danger zone → Delete my account</strong>.
              Deletion is immediate and irreversible — no recovery is possible after confirmation.
            </span>
          </div>
          <p style={s.p}>
            If you cannot access your account and wish to request deletion, contact us at{' '}
            <a href="mailto:support@nexofinance.app" style={s.link}>support@nexofinance.app</a>.
          </p>
        </Section>

        <Section icon="📬" title="6. Contact">
          <p style={s.p}>
            For any questions about this privacy policy or how we handle your data, you can reach us at:
          </p>
          <div style={s.contactBox}>
            <div style={s.contactRow}><span style={s.contactIcon}>📧</span> <a href="mailto:support@nexofinance.app" style={s.link}>support@nexofinance.app</a></div>
            <div style={s.contactRow}><span style={s.contactIcon}>🌐</span> Nexo Finance — personal finance management platform</div>
          </div>
        </Section>

        {/* Footer */}
        <div style={s.footer}>
          <p style={s.footerText}>© {new Date().getFullYear()} Nexo Finance. All rights reserved.</p>
          <Link to="/register" style={s.footerLink}>← Back to register</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg)',
    fontFamily: 'Montserrat, sans-serif',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    backgroundColor: 'var(--color-white)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '800',
    color: '#fff',
  },
  logoText: {
    fontSize: '17px',
    fontWeight: '800',
    color: 'var(--color-text)',
    letterSpacing: '-0.3px',
  },
  backLink: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#2563EB',
    textDecoration: 'none',
  },
  container: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '48px 24px 64px',
  },
  hero: {
    marginBottom: '40px',
  },
  heroBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    color: '#2563EB',
    backgroundColor: 'rgba(37,99,235,0.1)',
    padding: '4px 12px',
    borderRadius: '999px',
    marginBottom: '16px',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: '800',
    letterSpacing: '-1px',
    color: 'var(--color-text)',
    marginBottom: '12px',
  },
  heroSub: {
    fontSize: '15px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    lineHeight: 1.7,
    maxWidth: '620px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '40px',
  },
  summaryCard: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    padding: '16px',
    textAlign: 'center',
  },
  summaryIcon: {
    fontSize: '22px',
    display: 'block',
    marginBottom: '8px',
  },
  summaryLabel: {
    fontSize: '12px',
    fontWeight: '800',
    color: 'var(--color-text)',
    marginBottom: '4px',
  },
  summaryDesc: {
    fontSize: '11px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    lineHeight: 1.5,
  },
  section: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '28px',
    marginBottom: '16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  },
  sectionIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: 'var(--color-text)',
    letterSpacing: '-0.3px',
  },
  sectionBody: {
    fontSize: '14px',
    color: 'var(--color-text)',
    lineHeight: 1.7,
  },
  p: {
    margin: '0 0 14px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
  },
  list: {
    margin: '0 0 14px',
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  listItem: {
    color: 'var(--color-text-light)',
    fontWeight: '500',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  dataGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    overflow: 'hidden',
    marginTop: '8px',
  },
  dataRow: {
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    gap: '16px',
    padding: '11px 16px',
    borderBottom: '1px solid var(--color-border)',
    alignItems: 'start',
  },
  dataLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  dataValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--color-text-light)',
    lineHeight: 1.5,
  },
  code: {
    backgroundColor: 'var(--color-bg)',
    padding: '1px 6px',
    borderRadius: '5px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#2563EB',
  },
  deleteTip: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(37,99,235,0.06)',
    border: '1px solid rgba(37,99,235,0.15)',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '14px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--color-text)',
    lineHeight: 1.6,
  },
  deleteTipIcon: {
    fontSize: '16px',
    flexShrink: 0,
    marginTop: '1px',
  },
  contactBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: 'var(--color-bg)',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '8px',
  },
  contactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--color-text)',
  },
  contactIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  link: {
    color: '#2563EB',
    fontWeight: '700',
    textDecoration: 'none',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid var(--color-border)',
  },
  footerText: {
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#2563EB',
    textDecoration: 'none',
  },
};
