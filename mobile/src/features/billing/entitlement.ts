// Pure entitlement rules (user_flow.md v4 §3 "Global rules" + §2 "05 paywall").
// Free = one cleanup a day + balanced preset. Pro = unlimited + 720p.
// 30-day trash/restore is deliberately NOT part of the entitlement: it is free.

export type Entitlement = {
  pro: boolean;
  cleanupsToday: number;
  /** start-of-day ms of the last counted cleanup */
  lastCleanupDayMs: number;
};

export const FREE_DAILY_CLEANUPS = 1;
export const BALANCED_HEIGHT = 1080;
export const PRO_HEIGHT = 720;

export type CompressionPreset = 'balanced' | 'max';

export function isPro(e: Entitlement): boolean {
  return e.pro;
}

function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function canCleanupToday(e: Entitlement, nowMs: number): boolean {
  if (e.pro) return true;
  const todayStart = startOfLocalDay(nowMs);
  if (e.lastCleanupDayMs !== todayStart) return true;
  return e.cleanupsToday < FREE_DAILY_CLEANUPS;
}

/** count one applied cleanup; resets the counter when the local day rolls over */
export function consumeCleanup(e: Entitlement, nowMs: number): Entitlement {
  const todayStart = startOfLocalDay(nowMs);
  const count = e.lastCleanupDayMs === todayStart ? e.cleanupsToday + 1 : 1;
  return { ...e, cleanupsToday: count, lastCleanupDayMs: todayStart };
}

export function presetHeightPx(e: Entitlement, preset: CompressionPreset): number {
  if (preset === 'max') return e.pro ? PRO_HEIGHT : BALANCED_HEIGHT;
  return BALANCED_HEIGHT;
}

export function upgrade(e: Entitlement, _nowMs: number): Entitlement {
  return { ...e, pro: true };
}

export function downgrade(e: Entitlement): Entitlement {
  return { ...e, pro: false };
}
