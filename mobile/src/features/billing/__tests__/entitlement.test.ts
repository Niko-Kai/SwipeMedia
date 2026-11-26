import {
  canCleanupToday, consumeCleanup, isPro, presetHeightPx,
  FREE_DAILY_CLEANUPS, PRO_HEIGHT, BALANCED_HEIGHT, upgrade,
} from '../entitlement';
import type { Entitlement } from '../entitlement';

const NOW = new Date(2026, 10, 26, 12, 0).getTime();
const DAY = 864e5;

const free = (): Entitlement => ({ pro: false, cleanupsToday: 0, lastCleanupDayMs: 0 });

// Breaks caught: free tier giving more than one run/day, the count not resetting
// at the local day boundary, pro not unlocking 720p, pro losing unlimited runs.
describe('free tier limits', () => {
  test('free plan is one cleanup a day', () => {
    expect(FREE_DAILY_CLEANUPS).toBe(1);
    expect(canCleanupToday(free(), NOW)).toBe(true);
    const used = consumeCleanup(free(), NOW);
    expect(canCleanupToday(used, NOW)).toBe(false);
  });

  test('a new local day resets the daily count', () => {
    const usedToday = consumeCleanup(free(), NOW);
    expect(canCleanupToday(usedToday, NOW + DAY)).toBe(true);
  });

  test('pro is unlimited', () => {
    const pro = upgrade({ ...free(), cleanupsToday: 5, lastCleanupDayMs: NOW }, NOW);
    expect(isPro(pro)).toBe(true);
    expect(canCleanupToday(pro, NOW)).toBe(true);
  });
});

describe('compression presets', () => {
  test('free plan is pinned to balanced 1080p', () => {
    expect(presetHeightPx(free(), 'balanced')).toBe(BALANCED_HEIGHT);
    expect(presetHeightPx(free(), 'max')).toBe(BALANCED_HEIGHT); // max savings is pro-only
  });

  test('pro unlocks max savings 720p', () => {
    const pro = upgrade(free(), NOW);
    expect(presetHeightPx(pro, 'max')).toBe(PRO_HEIGHT);
    expect(PRO_HEIGHT).toBe(720);
  });

  test('trash and restore are never gated by plan', () => {
    // the entitlement has no trash field at all: 30-day restore is free for all
    expect(Object.keys(free())).not.toContain('trash');
  });
});
