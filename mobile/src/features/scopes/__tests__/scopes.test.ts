import {
  isToday, isYesterday, isWithinDays, isLargeVideo, isScreenshot, scopeStats,
} from '../scopes';
import type { MockAsset } from '../scopes';

const NOW = new Date(2026, 10, 25, 15, 0).getTime(); // Wed Nov 25 2026, 15:00 local

const mk = (over: Partial<MockAsset>): MockAsset => ({
  id: 'a',
  filename: 'IMG_1.jpg',
  sizeBytes: 1024,
  mediaType: 'photo',
  createdAtMs: NOW,
  ...over,
});

// Breaks caught: wrong window boundaries, wrong 50 MB threshold, wrong
// screenshot filename match, wrong aggregation math.
describe('scope predicates', () => {
  test('today: same local calendar day', () => {
    expect(isToday(mk({ createdAtMs: NOW }), NOW)).toBe(true);
    expect(isToday(mk({ createdAtMs: new Date(2026, 10, 25, 0, 0).getTime() }), NOW)).toBe(true);
    expect(isToday(mk({ createdAtMs: new Date(2026, 10, 24, 23, 59).getTime() }), NOW)).toBe(false);
  });

  test('yesterday: the local calendar day before today', () => {
    expect(isYesterday(mk({ createdAtMs: new Date(2026, 10, 24, 8, 0).getTime() }), NOW)).toBe(true);
    expect(isYesterday(mk({ createdAtMs: new Date(2026, 10, 23, 8, 0).getTime() }), NOW)).toBe(false);
    expect(isYesterday(mk({ createdAtMs: NOW }), NOW)).toBe(false);
  });

  test('last 7 days: a rolling window back from today', () => {
    expect(isWithinDays(mk({ createdAtMs: new Date(2026, 10, 19, 0, 1).getTime() }), 7, NOW)).toBe(true);
    expect(isWithinDays(mk({ createdAtMs: new Date(2026, 10, 19, 0, 0).getTime() }), 7, NOW)).toBe(true);
    expect(isWithinDays(mk({ createdAtMs: new Date(2026, 10, 18, 23, 59).getTime() }), 7, NOW)).toBe(false);
  });

  test('large videos: over 50 MB and a video (spec: > 50 MB)', () => {
    expect(isLargeVideo(mk({ mediaType: 'video', sizeBytes: 50 * 1024 ** 2 + 1 }))).toBe(true);
    expect(isLargeVideo(mk({ mediaType: 'video', sizeBytes: 50 * 1024 ** 2 }))).toBe(false);
    expect(isLargeVideo(mk({ mediaType: 'photo', sizeBytes: 200 * 1024 ** 2 }))).toBe(false);
  });

  test('screenshots: filename prefix, case-insensitive, both underscores and dashes', () => {
    expect(isScreenshot(mk({ filename: 'Screenshot_20261115-103010.png' }))).toBe(true);
    expect(isScreenshot(mk({ filename: 'Screenshot-2026-11-15.png' }))).toBe(true);
    expect(isScreenshot(mk({ filename: 'screenshot_2026.jpg' }))).toBe(true);
    expect(isScreenshot(mk({ filename: 'IMG_2470.jpg' }))).toBe(false);
  });
});

describe('scopeStats aggregation', () => {
  test('counts and bytes per date scope from fixtures', () => {
    const assets = [
      mk({ id: '1', sizeBytes: 2000, createdAtMs: new Date(2026, 10, 25, 9, 0).getTime() }),
      mk({ id: '2', sizeBytes: 3000, createdAtMs: new Date(2026, 10, 25, 10, 0).getTime() }),
      mk({ id: '3', sizeBytes: 5000, createdAtMs: new Date(2026, 10, 24, 9, 0).getTime() }),
      mk({ id: '4', sizeBytes: 9000, createdAtMs: new Date(2026, 10, 20, 9, 0).getTime() }),
      mk({ id: '5', sizeBytes: 1000, createdAtMs: new Date(2026, 9, 25, 9, 0).getTime() }),
    ];
    const stats = scopeStats(assets, NOW);
    expect(stats.today.count).toBe(2);
    expect(stats.today.bytes).toBe(5000);
    expect(stats.yesterday.count).toBe(1);
    expect(stats.yesterday.bytes).toBe(5000);
    expect(stats.last7Days.count).toBe(4);
    expect(stats.last7Days.bytes).toBe(19000);
  });

  test('high-yield scopes filter by type and size', () => {
    const assets = [
      mk({ id: '1', mediaType: 'video', sizeBytes: 60 * 1024 ** 2 }),
      mk({ id: '2', mediaType: 'video', sizeBytes: 5 * 1024 ** 2 }),
      mk({ id: '3', filename: 'Screenshot_1.png', mediaType: 'photo' }),
      mk({ id: '4', filename: 'IMG_2.jpg', mediaType: 'photo' }),
    ];
    const stats = scopeStats(assets, NOW);
    expect(stats.largeVideos.count).toBe(1);
    expect(stats.largeVideos.bytes).toBe(60 * 1024 ** 2);
    expect(stats.screenshots.count).toBe(1);
    expect(stats.screenshots.bytes).toBe(1024);
  });
});
