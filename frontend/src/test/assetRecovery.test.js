import { afterEach, expect, it, vi } from 'vitest';
import { setupAssetRecovery } from '../utils/assetRecovery';

afterEach(() => { sessionStorage.clear(); });

it('reloads an outdated page once and preserves its current URL and history state', () => {
  const target = new EventTarget();
  target.sessionStorage = sessionStorage;
  target.location = { reload: vi.fn() };
  const cleanup = setupAssetRecovery(target);
  try {
    const first = new Event('vite:preloadError', { cancelable: true });
    target.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(true);
    expect(target.location.reload).toHaveBeenCalledTimes(1);
    const second = new Event('vite:preloadError', { cancelable: true });
    target.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(false);
    expect(target.location.reload).toHaveBeenCalledTimes(1);
  } finally { cleanup(); }
});

it('does not automatically reload when browser storage is unavailable', () => {
  const target = new EventTarget();
  target.sessionStorage = { getItem: () => { throw new Error('Unavailable'); } };
  target.location = { reload: vi.fn() };
  const cleanup = setupAssetRecovery(target);
  try {
    const event = new Event('vite:preloadError', { cancelable: true });
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(target.location.reload).not.toHaveBeenCalled();
  } finally { cleanup(); }
});
