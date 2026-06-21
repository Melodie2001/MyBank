import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import { useIsMobile } from '../hooks/useIsMobile';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';

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

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Weak', color: '#DC2626' };
  if (score <= 3) return { score, label: 'Fair', color: '#D97706' };
  if (score === 4) return { score, label: 'Good', color: '#2563EB' };
  return { score, label: 'Strong', color: '#16A34A' };
}

export default function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPrivacy, setShowPrivacy] = useState(false);
  const isMobile = useIsMobile();
  const pwdStrength = getPasswordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, firstName, lastName, phone || undefined, birthDate || undefined, gender || undefined);
      navigate('/login', {
        state: { message: 'Account created! Wait for admin approval before signing in.' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...styles.page, ...(isMobile ? { padding: 0 } : {}) }}>
      <Link to="/" style={styles.backHome}>← Back to home</Link>
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
              Free account
            </div>

            <h1 style={styles.leftTitle}>
              Start managing<br />your <span style={{ color: '#2563EB' }}>finances</span>
            </h1>
            <p style={styles.leftSubtitle}>
              Create your free account in less than a minute and take control of your spending today.
            </p>
          </div>

          <div style={styles.features}>
            <div style={styles.feature}>
              <div style={styles.featureNum}>1</div>
              <div>
                <div style={styles.featureTitle}>Create your account</div>
                <div style={styles.featureDesc}>Fill in your details — it only takes 1 minute</div>
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureNum}>2</div>
              <div>
                <div style={styles.featureTitle}>Set up your categories</div>
                <div style={styles.featureDesc}>Organize your expenses the way you want</div>
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureNum}>3</div>
              <div>
                <div style={styles.featureTitle}>Track your spending</div>
                <div style={styles.featureDesc}>Add operations and see where your money goes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ ...styles.right, ...(isMobile ? { padding: '40px 24px', flex: 1 } : {}) }}>
          <div style={styles.rightInner}>
            <h2 style={styles.rightTitle}>Create an account ✨</h2>
            <p style={styles.rightSubtitle}>Join Nexo Finance and take control of your budget</p>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={{ ...styles.row, ...(isMobile ? { flexDirection: 'column' } : {}) }}>
                <div style={styles.field}>
                  <label style={styles.label}>FIRST NAME</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>👤</span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={styles.input}
                      placeholder="Jane"
                      required
                    />
                  </div>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>LAST NAME</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>👤</span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={styles.input}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              </div>

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

              <div style={{ ...styles.row, ...(isMobile ? { flexDirection: 'column' } : {}) }}>
                <div style={styles.field}>
                  <label style={styles.label}>PHONE NUMBER</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>📱</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={styles.input}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>DATE OF BIRTH</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>🎂</span>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      style={styles.input}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>GENDER</label>
                <div style={styles.genderGroup}>
                  {[
                    { value: 'male', label: 'Male', emoji: '👨' },
                    { value: 'female', label: 'Female', emoji: '👩' },
                    { value: 'non-binary', label: 'Non-binary', emoji: '🧑' },
                    { value: 'prefer_not_to_say', label: 'Prefer not to say', emoji: '🤐' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGender(gender === opt.value ? '' : opt.value)}
                      style={{
                        ...styles.genderBtn,
                        ...(gender === opt.value ? styles.genderBtnActive : {}),
                      }}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
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
                    placeholder="Min. 6 characters"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {password && (
                <div style={styles.strengthWrapper}>
                  <div style={styles.strengthBars}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{
                        ...styles.strengthBar,
                        backgroundColor: i <= pwdStrength.score ? pwdStrength.color : 'var(--color-border)',
                      }} />
                    ))}
                  </div>
                  <span style={{ ...styles.strengthLabel, color: pwdStrength.color }}>
                    {pwdStrength.label}
                  </span>
                </div>
              )}

              <div style={styles.field}>
                <label style={styles.label}>CONFIRM PASSWORD</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>🔒</span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ ...styles.input, paddingRight: '40px' }}
                    placeholder="Repeat your password"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={styles.checkbox}
                />
                <span style={{ fontSize: '13px', color: 'var(--color-text-light)', fontWeight: '500' }}>
                  I agree to the{' '}
                  <span style={styles.termsLink}>Terms of Service</span>
                  {' '}and{' '}
                  <button type="button" onClick={() => setShowPrivacy(true)} style={styles.termsLink}>Privacy Policy</button>
                  {' '}of Nexo Finance
                </span>
              </label>

              <button type="submit" style={styles.btnPrimary} disabled={loading}>
                {loading ? 'Creating account...' : 'Create my account →'}
              </button>
            </form>

            <p style={styles.switchText}>
              Already have an account?{' '}
              <Link to="/login" style={styles.link}>Sign in</Link>
            </p>
          </div>
        </div>

      </div>
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
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
    position: 'relative',
  },
  backHome: {
    position: 'absolute',
    top: '20px',
    left: '24px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#2563EB',
    textDecoration: 'none',
    fontFamily: 'Montserrat, sans-serif',
    zIndex: 10,
  },
  container: {
    display: 'flex',
    width: '100%',
    maxWidth: '1000px',
    minHeight: '650px',
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

  /* ===== Background decoration ===== */
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
    gap: '16px',
    position: 'relative',
    zIndex: 1,
  },
  feature: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  featureNum: {
    width: '24px',
    height: '24px',
    borderRadius: '8px',
    backgroundColor: 'rgba(37,99,235,0.15)',
    border: '1px solid rgba(37,99,235,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    color: '#7DA8FF',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '2px',
  },
  featureDesc: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.45)',
  },
  right: {
    flex: 1,
    backgroundColor: 'var(--color-white)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
    overflowY: 'auto',
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
    marginBottom: '28px',
    fontWeight: '500',
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
    gap: '14px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
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
    padding: '12px 14px 12px 38px',
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
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#2563EB',
    width: '15px',
    height: '15px',
    marginTop: '2px',
    flexShrink: 0,
  },
  termsLink: {
    color: '#2563EB',
    fontWeight: '700',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 'inherit',
  },
  btnPrimary: {
    backgroundColor: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontWeight: '700',
    fontSize: '15px',
    fontFamily: 'Montserrat, sans-serif',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    boxShadow: '0 10px 24px -8px rgba(37,99,235,0.4)',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    marginTop: '20px',
  },
  link: {
    color: '#2563EB',
    fontWeight: '700',
  },
  strengthWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '-6px',
  },
  strengthBars: {
    display: 'flex',
    gap: '4px',
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: '4px',
    borderRadius: '999px',
    transition: 'background-color 0.2s',
  },
  strengthLabel: {
    fontSize: '11px',
    fontWeight: '700',
    minWidth: '44px',
    textAlign: 'right',
  },
  genderGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  genderBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1.5px solid var(--color-border)',
    backgroundColor: 'var(--color-input-bg)',
    color: 'var(--color-text-light)',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s, background 0.15s',
  },
  genderBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37,99,235,0.08)',
    color: '#2563EB',
  },
};