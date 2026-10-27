import { describe, expect, it } from 'vitest';
import { relativeTime } from '../utils/relativeTime';

const now = Date.parse('2026-10-27T12:00:00Z');
describe('notification time labels', () => {
  it('uses unambiguous minutes instead of a single m', () => {
    expect(relativeTime('2026-10-27T11:59:00Z', now)).toBe('1 minute ago');
    expect(relativeTime('2026-10-27T11:57:00Z', now)).toBe('3 minutes ago');
  });
  it('respects timezone offsets and hour/day boundaries', () => {
    expect(relativeTime('2026-10-27T12:57:00+01:00', now)).toBe('3 minutes ago');
    expect(relativeTime('2026-10-27T11:00:00Z', now)).toBe('1 hour ago');
    expect(relativeTime('2026-10-26T12:00:00Z', now)).toBe('1 day ago');
  });
  it('handles recent, future and invalid dates without negative or NaN labels', () => {
    expect(relativeTime('2026-10-27T11:59:59Z', now)).toBe('Just now');
    expect(relativeTime('2026-10-27T12:00:30Z', now)).toBe('Just now');
    expect(relativeTime('invalid', now)).toBe('Date unavailable');
  });
});
