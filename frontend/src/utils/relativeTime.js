export function relativeTime(dateStr, now = Date.now()) {
  const date = new Date(dateStr);
  if (!Number.isFinite(date.getTime())) return 'Date unavailable';
  const seconds = Math.max(0, (now - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  // Spell out units: browsers translating "1m ago" can interpret m as months.
  const [amount, unit] = seconds < 3600
    ? [Math.floor(seconds / 60), 'minute']
    : seconds < 86400
      ? [Math.floor(seconds / 3600), 'hour']
      : [Math.floor(seconds / 86400), 'day'];
  if (seconds < 86400 * 7) return `${amount} ${unit}${amount === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
