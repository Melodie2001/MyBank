import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { getMe, updateMe, updatePassword, deleteMe } from '../services/userService';
import { logout } from '../services/authService';

const GENDER_LABELS = {
  male: { label: 'Male', emoji: '👨' },
  female: { label: 'Female', emoji: '👩' },
  'non-binary': { label: 'Non-binary', emoji: '🧑' },
  prefer_not_to_say: { label: 'Prefer not to say', emoji: '🤐' },
};

function formatBirthDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function calcAge(dateStr) {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) age--;
  return age;
}

export default function Profile() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
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
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

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
    } finally {
      setLoading(false);
    }
  }

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
    setPwdSuccess('');

    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters');
      return;
    }

    setPwdLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setPwdSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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

  if (loading) return <div style={styles.loading}>Loading...</div>;

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';
  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`
    : 'Account holder';

  const age = calcAge(user?.birthDate);
  const genderInfo = GENDER_LABELS[user?.gender];

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Profile</h1>
        <p style={styles.subtitle}>Manage your account information and security</p>
      </div>

      <div style={{ ...styles.grid, ...(isMobile ? { gridTemplateColumns: '1fr' } : {}) }}>
        {/* Left: avatar card */}
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <div style={styles.avatarBig}>{initials}</div>
          <div style={styles.fullName}>{fullName}</div>
          <div style={styles.emailText}>{user?.email}</div>
          <div style={styles.roleBadge}>
            {user?.roles?.includes('ROLE_ADMIN') ? '🛡️ Administrator' : '👤 Account holder'}
          </div>

          <div style={styles.infoList}>
            {user?.phone && (
              <div style={styles.infoRow}>
                <span style={styles.infoIcon}>📱</span>
                <div>
                  <div style={styles.infoLabel}>Phone</div>
                  <div style={styles.infoValue}>{user.phone}</div>
                </div>
              </div>
            )}
            {user?.birthDate && (
              <div style={styles.infoRow}>
                <span style={styles.infoIcon}>🎂</span>
                <div>
                  <div style={styles.infoLabel}>Date of birth</div>
                  <div style={styles.infoValue}>
                    {formatBirthDate(user.birthDate)}
                    {age !== null && <span style={styles.ageBadge}>{age} years</span>}
                  </div>
                </div>
              </div>
            )}
            {genderInfo && (
              <div style={styles.infoRow}>
                <span style={styles.infoIcon}>{genderInfo.emoji}</span>
                <div>
                  <div style={styles.infoLabel}>Gender</div>
                  <div style={styles.infoValue}>{genderInfo.label}</div>
                </div>
              </div>
            )}
            {!user?.phone && !user?.birthDate && !user?.gender && (
              <div style={styles.emptyInfo}>
                Complete your profile by filling in the form →
              </div>
            )}
          </div>
        </div>

        {/* Right: forms */}
        <div style={styles.rightCol}>

          {/* Personal info */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Personal information</h2>
            <p style={styles.cardSubtitle}>Update your personal details</p>

            {infoSuccess && <div style={styles.success}>{infoSuccess}</div>}
            {infoError && <div style={styles.error}>{infoError}</div>}

            <form onSubmit={handleInfoSubmit} style={styles.form}>
              <div style={{ ...styles.row, ...(isMobile ? { flexDirection: 'column' } : {}) }}>
                <div style={styles.field}>
                  <label style={styles.label}>FIRST NAME</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    style={styles.input}
                    placeholder="Jane"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>LAST NAME</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    style={styles.input}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div style={{ ...styles.row, ...(isMobile ? { flexDirection: 'column' } : {}) }}>
                <div style={styles.field}>
                  <label style={styles.label}>PHONE NUMBER</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={styles.input}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>DATE OF BIRTH</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    style={styles.input}
                    max={new Date().toISOString().split('T')[0]}
                  />
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

              <div style={styles.formActions}>
                <button type="submit" style={styles.btnSave} disabled={infoLoading}>
                  {infoLoading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Security */}
          <div style={{ ...styles.card, marginTop: '16px' }}>
            <h2 style={styles.cardTitle}>Security</h2>
            <p style={styles.cardSubtitle}>Change your password</p>

            {pwdSuccess && <div style={styles.success}>{pwdSuccess}</div>}
            {pwdError && <div style={styles.error}>{pwdError}</div>}

            <form onSubmit={handlePasswordSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>CURRENT PASSWORD</label>
                <div style={styles.inputWrapper}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    style={{ ...styles.input, paddingRight: '40px' }}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
                    {showCurrent ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ ...styles.row, ...(isMobile ? { flexDirection: 'column' } : {}) }}>
                <div style={styles.field}>
                  <label style={styles.label}>NEW PASSWORD</label>
                  <div style={styles.inputWrapper}>
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ ...styles.input, paddingRight: '40px' }}
                      placeholder="Min. 6 characters"
                      required
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                      {showNew ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>CONFIRM NEW PASSWORD</label>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={styles.input}
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={styles.btnSave} disabled={pwdLoading}>
                  {pwdLoading ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </form>
          </div>

          {/* Account deletion */}
          <div style={{ ...styles.card, marginTop: '16px' }}>
            <h2 style={styles.cardTitle}>Delete account</h2>
            <p style={styles.cardSubtitle}>Permanently remove your account and all associated data</p>

            <div style={styles.dangerRow}>
              <div style={styles.dangerDesc}>
                Once deleted, your operations, budgets, categories and notifications cannot be recovered.
              </div>
              <button style={styles.btnDanger} onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); setDeleteError(''); }}>
                Delete my account
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div style={styles.overlay}>
          <div style={{ ...styles.deleteModal, ...(isMobile ? { padding: '24px 16px', maxHeight: '90vh', overflowY: 'auto', margin: '0 16px' } : {}) }}>
            <div style={styles.deleteModalIcon}>⚠️</div>
            <h2 style={styles.deleteModalTitle}>Delete your account?</h2>
            <p style={styles.deleteModalText}>
              This will permanently delete your account and all associated data:
              operations, budgets, categories, and notifications.
              <strong> This action cannot be undone.</strong>
            </p>
            <div style={styles.deleteModalConfirmBox}>
              <label style={styles.label}>Type <strong>DELETE</strong> to confirm</label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                style={{ ...styles.input, borderColor: deleteConfirm === 'DELETE' ? '#DC2626' : undefined }}
                placeholder="DELETE"
                autoFocus
              />
            </div>
            {deleteError && <div style={styles.error}>{deleteError}</div>}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '16px',
    alignItems: 'start',
  },
  card: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '28px',
    fontFamily: 'Inter, sans-serif',
  },
  avatarBig: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    backgroundColor: '#2563EB',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: '800',
    margin: '0 auto 16px',
  },
  fullName: {
    fontSize: '17px',
    fontWeight: '800',
    color: 'var(--color-text)',
    marginBottom: '4px',
    textAlign: 'center',
  },
  emailText: {
    fontSize: '12px',
    color: 'var(--color-text-light)',
    fontWeight: '500',
    marginBottom: '14px',
    textAlign: 'center',
    wordBreak: 'break-all',
  },
  roleBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: 'var(--color-bg-soft)',
    padding: '6px 14px',
    borderRadius: '999px',
    textAlign: 'center',
    width: '100%',
    marginBottom: '20px',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    borderTop: '1px solid var(--color-border)',
    paddingTop: '20px',
    textAlign: 'left',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  infoIcon: {
    fontSize: '18px',
    lineHeight: 1,
    marginTop: '2px',
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--color-text-light)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '2px',
  },
  infoValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  ageBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: 'var(--color-bg-soft)',
    padding: '2px 8px',
    borderRadius: '999px',
  },
  emptyInfo: {
    fontSize: '12px',
    color: 'var(--color-text-light)',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: '1.6',
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
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s, background 0.15s',
  },
  genderBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37,99,235,0.08)',
    color: '#2563EB',
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
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
};
