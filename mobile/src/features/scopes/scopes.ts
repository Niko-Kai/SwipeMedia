// Pure scope predicates + aggregation for the dashboard (user_flow.md v4 §2, "01").
// Window math goes through src/lib/dates (DST-safe local days).
import { isSameLocalDay } from '@/lib/dates';

export type MockAsset = {
  id: string;
  filename: string;
  sizeBytes: number;
  mediaType: 'photo' | 'video';
  createdAtMs: number;
};

export type ScopeStats = { count: number; bytes: number };

export function isToday(asset: MockAsset, nowMs: number): boolean {
  return isSameLocalDay(asset.createdAtMs, nowMs);
}

export function isYesterday(asset: MockAsset, nowMs: number): boolean {
  const d = new Date(nowMs);
  const yesterday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1).getTime();
  return isSameLocalDay(asset.createdAtMs, yesterday);
}

export function isWithinDays(asset: MockAsset, days: number, nowMs: number): boolean {
  const d = new Date(nowMs);
  const windowStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (days - 1)).getTime();
  return asset.createdAtMs >= windowStart;
}

/** spec: high-yield scope "large videos > 50 MB" */
export function isLargeVideo(asset: MockAsset): boolean {
  return asset.mediaType === 'video' && asset.sizeBytes > 50 * 1024 ** 2;
}

export function isScreenshot(asset: MockAsset): boolean {
  return asset.filename.toLowerCase().startsWith('screenshot');
}

export function scopeStats(assets: MockAsset[], nowMs: number) {
  const acc = () => ({ count: 0, bytes: 0 });
  const stats = {
    today: acc(),
    yesterday: acc(),
    last7Days: acc(),
    largeVideos: acc(),
    screenshots: acc(),
  };
  for (const a of assets) {
    if (isToday(a, nowMs)) {
      stats.today.count++; stats.today.bytes += a.sizeBytes;
    }
    if (isYesterday(a, nowMs)) {
      stats.yesterday.count++; stats.yesterday.bytes += a.sizeBytes;
    }
    if (isWithinDays(a, 7, nowMs)) {
      stats.last7Days.count++; stats.last7Days.bytes += a.sizeBytes;
    }
    if (isLargeVideo(a)) {
      stats.largeVideos.count++; stats.largeVideos.bytes += a.sizeBytes;
    }
    if (isScreenshot(a)) {
      stats.screenshots.count++; stats.screenshots.bytes += a.sizeBytes;
    }
  }
  return stats;
}
