import Icon from './Icon';

const rules = [
  ['At least 12 characters', value => value.length >= 12],
  ['One uppercase letter', value => /[A-Z]/.test(value)],
  ['One lowercase letter', value => /[a-z]/.test(value)],
  ['One number', value => /\d/.test(value)],
  ['One special character', value => /[\W_]/.test(value)],
];

export default function PasswordRequirements({ password }) {
  return <ul id="profile-password-requirements" className="profile-password-requirements" aria-label="Password requirements">
    {rules.map(([label, test]) => {
      const met = test(password);
      return <li key={label} className={met ? 'is-met' : ''}>
        <span aria-hidden="true" className="profile-rule-mark">{met ? <Icon name="check" size={14} /> : '○'}</span>
        <span>{label}<span className="profile-sr-only">{met ? ' — met' : ' — not met'}</span></span>
      </li>;
    })}
  </ul>;
}
