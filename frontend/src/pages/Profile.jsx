import Icon from '../components/Icon';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import PasswordRequirements from '../components/PasswordRequirements';
import LoadError from '../components/LoadError';
import '../styles/profile.css';
import { getMe, updateMe, updatePassword, deleteMe } from '../services/userService';
import { logout } from '../services/authService';

export default function Profile() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('personal');
  const [loadError, setLoadError] = useState(false);
  const tabRefs = useRef({});
  const dialogRef = useRef(null);
  const deleteOpenerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Personal info form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoLoading, setInfoLoading] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await getMe();
        setUser(data);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setBirthDate(data.birthDate || '');
        setGender(data.gender || '');
      } catch (err) {
        console.error(err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  async function handleInfoSubmit(e) {
    e.preventDefault();
    setInfoError('');
    setInfoSuccess('');
    setInfoLoading(true);

    try {
      const res = await updateMe({
        firstName,
        lastName,
        email,
        phone: phone || null,
        birthDate: birthDate || null,
        gender: gender || null,
      });
      setUser(res.user);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, firstName, lastName, email }));
      setInfoSuccess('Profile updated successfully');
    } catch (err) {
      setInfoError(err.response?.data?.message || 'An error occurred');
    } finally {
      setInfoLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwdError('');

    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/.test(newPassword)) {
      setPwdError('New password must contain at least 12 characters, an uppercase letter, a lowercase letter, a number and a special character');
      return;
    }

    setPwdLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      logout();
      navigate('/login', {
        replace: true,
        state: { message: 'Password updated successfully. Please sign in again.' },
      });
    } catch (err) {
      setPwdError(err.response?.data?.message || 'An error occurred');
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteMe();
      logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'An error occurred');
      setDeleteLoading(false);
    }
  }

  useEffect(() => {
    if (!showDeleteModal) return;
    const previousOverflow = document.body.style.overflow;
    const opener = deleteOpenerRef.current;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [showDeleteModal]);

  function handleDialogKey(event) {
    if (event.key === 'Escape' && !deleteLoading) setShowDeleteModal(false);
    if (event.key !== 'Tab') return;
    const controls = [...dialogRef.current.querySelectorAll('input:not(:disabled), button:not(:disabled)')];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  if (loadError) return <LoadError />;
  if (loading) return <div style={styles.loading}>Loading...</div>;

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';
  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`
    : 'Account holder';

  function selectTab(next) {
    setTab(next);
    if (next === 'personal') {
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPwdError('');
    }
  }
  function handleTabKey(event, current) {
    let next;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') next = current === 'personal' ? 'security' : 'personal';
    if (event.key === 'Home') next = 'personal';
    if (event.key === 'End') next = 'security';
    if (!next) return;
    event.preventDefault(); selectTab(next); tabRefs.current[next]?.focus();
  }
  return (
    <div className="profile-page">
      <div inert={showDeleteModal ? true : undefined}>
      <div style={styles.header}>
        <h1 style={styles.title}>My profile</h1>
        <p style={styles.subtitle}>Manage your account information and security</p>
      </div>
      <section className="profile-identity" aria-label="Account summary">
        <div className="profile-avatar" aria-hidden="true">{initials}</div>
        <div className="profile-identity-text"><h2>{fullName}</h2><p>{user?.email}</p></div>
        <span className="profile-badge">{user?.roles?.includes('ROLE_ADMIN') ? 'Administrator' : 'Personal account'}</span>
      </section>
      <div role="tablist" aria-label="Profile settings" className="profile-tabs">
        {[['personal', 'Personal information'], ['security', 'Security']].map(([key, title]) => (
          <button type="button" key={key} role="tab" id={`profile-tab-${key}`} aria-selected={tab === key}
            aria-controls={`profile-panel-${key}`} tabIndex={tab === key ? 0 : -1}
            ref={element => { tabRefs.current[key] = element; }} disabled={infoLoading || pwdLoading}
            onClick={() => selectTab(key)} onKeyDown={event => handleTabKey(event, key)}>{title}</button>
        ))}
      </div>
      <div style={styles.rightCol}>
        <div>
          {/* Personal info */}
          <div role="tabpanel" id="profile-panel-personal" aria-labelledby="profile-tab-personal" hidden={tab !== 'personal'} className="profile-card" style={styles.card}>
            <h2 style={styles.cardTitle}>Personal information</h2>
            <p style={styles.cardSubtitle}>Update your personal details</p>

            {infoSuccess && <div role="status" style={styles.success}>{infoSuccess}</div>}
            {infoError && <div role="alert" style={styles.error}>{infoError}</div>}

            <form onSubmit={handleInfoSubmit} className="profile-personal-form" style={styles.form}>
              <div className="profile-form-row" style={styles.row}>
                <div style={styles.field}>
                  <label htmlFor="profile-first-name" style={styles.label}>First name *</label>
                  <input
                    id="profile-first-name" autoComplete="given-name" required maxLength={100}
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    style={styles.input}
                    placeholder="Jane"
                  />
                </div>
                <div style={styles.field}>
                  <label htmlFor="profile-last-name" style={styles.label}>Last name *</label>
                  <input
                    id="profile-last-name" autoComplete="family-name" required maxLength={100}
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    style={styles.input}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label htmlFor="profile-email" style={styles.label}>Email address *</label>
                <input
                  id="profile-email" autoComplete="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="profile-form-row" style={styles.row}>
                <div style={styles.field}>
                  <label htmlFor="profile-phone" style={styles.label}>Phone number (optional)</label>
                  <input
                    id="profile-phone" autoComplete="tel" maxLength={30}
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={styles.input}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div style={styles.field}>
                  <label htmlFor="profile-birth-date" style={styles.label}>Date of birth (optional)</label>
                  <input
                    id="profile-birth-date" autoComplete="bday"
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    style={styles.input}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label htmlFor="profile-gender" style={styles.label}>Gender (optional)</label>
                <select id="profile-gender" value={gender} onChange={e => setGender(e.target.value)} style={styles.input}>
                  <option value="">Not provided</option>
                  {[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'non-binary', label: 'Non-binary' },
                    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                  ].map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="profile-personal-actions" style={styles.formActions}>
                <p className="profile-required-note">* Required fields</p>
                <button type="submit" style={styles.btnSave} disabled={infoLoading}>
                  {infoLoading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>

          <section role="tabpanel" id="profile-panel-security" aria-labelledby="profile-tab-security" hidden={tab !== 'security'}>
          {/* Security */}
          <div className="profile-card" style={styles.card}>
            <h2 style={styles.cardTitle}><Icon name="shield" /> Change my password</h2>
            <p style={styles.cardSubtitle}>You will need to sign in again after changing your password.</p>

            {pwdError && <div role="alert" style={styles.error}>{pwdError}</div>}

            <form onSubmit={handlePasswordSubmit} style={styles.form}>
              <div style={styles.field}>
                <label htmlFor="profile-current-password" style={styles.label}>Current password *</label>
                <div style={styles.inputWrapper}>
                  <input
                    id="profile-current-password" autoComplete="current-password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    style={{ ...styles.input, paddingRight: '40px' }}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} aria-label={showCurrent ? "Hide password" : "Show password"} style={styles.eyeBtn}>
                    <Icon name={showCurrent ? 'eyeOff' : 'eye'} />
                  </button>
                </div>
              </div>

              <div style={{ ...styles.row, ...(isMobile ? { flexDirection: 'column' } : {}) }}>
                <div style={styles.field}>
                  <label htmlFor="profile-new-password" style={styles.label}>New password *</label>
                  <div style={styles.inputWrapper}>
                    <input
                      id="profile-new-password" aria-describedby="profile-password-requirements" maxLength={4096}
                      minLength={12} autoComplete="new-password" type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ ...styles.input, paddingRight: '40px' }}
                      placeholder="Min. 12 characters"
                      required
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} aria-label={showNew ? "Hide password" : "Show password"} style={styles.eyeBtn}>
                      <Icon name={showNew ? 'eyeOff' : 'eye'} />
                    </button>
                  </div>
                </div>
                <div style={styles.field}>
                  <label htmlFor="profile-confirm-password" style={styles.label}>Confirm new password *</label>
                  <input
                    id="profile-confirm-password" maxLength={4096}
                    minLength={12} autoComplete="new-password" type={showNew ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={styles.input}
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>

              <PasswordRequirements password={newPassword} />
              <div style={styles.formActions}>
                <button type="submit" style={styles.btnSave} disabled={pwdLoading}>
                  {pwdLoading ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </form>
          </div>

          {/* Account deletion */}
          <div className="profile-card profile-delete-card" style={styles.card}>
            <h2 style={styles.cardTitle}>Delete account</h2>
            <div style={styles.dangerRow}>
              <div style={styles.dangerDesc}>
                Permanently delete your account and associated data. This action cannot be undone.
              </div>
              <button ref={deleteOpenerRef} className="profile-delete-outline" style={styles.btnDanger} onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); setDeleteError(''); }}>
                Delete my account
              </button>
            </div>
          </div>
          </section>
        </div>
      </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div style={styles.overlay}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="profile-delete-dialog-title" aria-describedby="profile-delete-description" onKeyDown={handleDialogKey} style={{ ...styles.deleteModal, ...(isMobile ? { padding: '24px 16px', maxHeight: '90vh', overflowY: 'auto', margin: '0 16px' } : {}) }}>
            <div style={styles.deleteModalIcon}><Icon name="alert" /></div>
            <h2 id="profile-delete-dialog-title" style={styles.deleteModalTitle}>Delete your account?</h2>
            <p id="profile-delete-description" style={styles.deleteModalText}>
              This will permanently delete your account and all associated data:
              operations, budgets, categories, and notifications.
              <strong> This action cannot be undone.</strong>
            </p>
            <div style={styles.deleteModalConfirmBox}>
              <label htmlFor="profile-delete-confirm" style={styles.label}>Type <strong>DELETE</strong> to confirm</label>
              <input
                id="profile-delete-confirm" disabled={deleteLoading}
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                style={{ ...styles.input, borderColor: deleteConfirm === 'DELETE' ? '#DC2626' : undefined }}
                placeholder="DELETE"
                autoFocus
              />
            </div>
            {deleteError && <div role="alert" style={styles.error}>{deleteError}</div>}
            <div style={styles.deleteModalActions}>
              <button
                style={styles.btnCancel}
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.btnDanger,
                  opacity: deleteConfirm !== 'DELETE' ? 0.4 : 1,
                  cursor: deleteConfirm !== 'DELETE' ? 'not-allowed' : 'pointer',
                }}
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '16px',
    color: 'var(--color-text-light)',
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
  },
  card: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '28px',
    fontFamily: 'Inter, sans-serif',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--color-text)',
    marginBottom: '4px',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    marginBottom: '20px',
  },
  success: {
    backgroundColor: '#ECFDF5',
    color: '#16A34A',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  error: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  field: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
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
  input: {
    backgroundColor: 'var(--color-input-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: '12px 14px',
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
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  btnSave: {
    backgroundColor: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '11px 22px',
    fontWeight: '700',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    boxShadow: '0 10px 24px -8px rgba(37,99,235,0.4)',
  },
  dangerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  dangerDesc: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--color-text-light)',
    maxWidth: '420px',
    lineHeight: 1.5,
  },
  btnDanger: {
    backgroundColor: '#DC2626',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '11px 22px',
    fontWeight: '700',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    flexShrink: 0,
  },
  btnCancel: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-light)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: '11px 22px',
    fontWeight: '700',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(11,30,61,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  deleteModal: {
    backgroundColor: 'var(--color-white)',
    borderRadius: '20px',
    padding: '36px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 60px -20px rgba(11,30,61,0.3)',
    fontFamily: 'Inter, sans-serif',
  },
  deleteModalIcon: {
    fontSize: '36px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  deleteModalTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: '12px',
  },
  deleteModalText: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--color-text-light)',
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: '24px',
  },
  deleteModalConfirmBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  deleteModalActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
};
