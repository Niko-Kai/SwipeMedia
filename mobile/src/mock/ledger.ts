// Sample-data ledger — every number reconciles (user_flow.md §4).
// P0 renders these as-is; P1 replaces with real MediaStore data.
const MB = 1024 ** 2;
const GB = 1024 ** 3;

export const storage = { usedGB: 58.2, freeGB: 5.8, totalGB: 64 };

export const savedSoFarGB = 9.4;

export const highYieldScopes = [
  { id: 'videos', label: 'large videos', detail: '38', bytes: 12.4 * GB },
  { id: 'screenshots', label: 'screenshots', detail: '1,204', bytes: 3.1 * GB },
];

export type DateScope = {
  id: string;
  label: string;
  detail: string;
  bytes?: number;
  selected?: boolean;
};

export const dateScopes: DateScope[] = [
  { id: 'today', label: 'today', detail: '84 items', bytes: 2.1 * GB, selected: true },
  { id: 'yesterday', label: 'yesterday', detail: '132 items', bytes: 6.4 * GB },
  { id: 'last7', label: 'last 7 days', detail: '312 items', bytes: 7.8 * GB },
  { id: 'range', label: 'pick a date', detail: 'any range you choose' },
];

export const deck = {
  positionLabel: '12 of 84',
  savedBytes: 600.0 * MB,
  progress: 0.14,
  filename: 'IMG_2481.HEIC',
  sizeMB: 4.2,
};

export const gallery = {
  title: 'today',
  meta: '84 items, 2.1 GB',
  selectedCount: 3,
  selectedBytes: 18.4 * MB,
  tileCount: 30,
  selectedTiles: [2, 7, 15],
};

export const session = {
  freedBytes: 1.8 * GB,
  removedCount: 24,
  removedBytes: 1.2 * GB,
  compressedCount: 12,
  compressedBytes: 600.0 * MB,
  afterUsedGB: 56.4,
  afterFreeGB: 7.6,
  savedTotalGB: 11.2,
};

export const applying = {
  overall: 0.35,
  overallLabel: '35%',
  ofLabel: 'of 12 videos compressed',
  freedSoFarBytes: 210 * MB,
  current: {
    name: 'IMG_2510.MOV',
    fromMB: 62.4,
    toMB: 24.8,
    progress: 0.6,
    indexLabel: 'video 3 of 12 · 60%',
  },
  upNext: ['IMG_2518.MOV 96.3 MB', 'IMG_2522.MOV 41.2 MB', '+ 8 more'],
  estimate: 'estimated 1:40 left',
  total: '600 MB total',
};

export const trash = {
  count: 36,
  bytes: 1.8 * GB,
  rows: [
    { id: 1, name: 'IMG_2494.MOV', sizeMB: 48.6, daysLeft: 29 },
    { id: 2, name: 'IMG_2481.HEIC', sizeMB: 4.2, daysLeft: 29 },
    { id: 3, name: 'Screenshot_0623', sizeMB: 2.8, daysLeft: 29 },
    { id: 4, name: 'IMG_2470.HEIC', sizeMB: 6.1, daysLeft: 29 },
    { id: 5, name: 'IMG_2455.MOV', sizeMB: 96.3, daysLeft: 29 },
  ],
  showing: 'showing 5 of 36 · newest first',
};

export const calendar = {
  hint: 'jun 15 – jun 18 · 4 days',
  monthLabel: '‹ june 2026 ›',
  weekdays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  daysInMonth: 30,
  selectedRange: [15, 18] as const,
  today: 23,
};

export const paywall = {
  plans: [
    { id: 'annual', label: 'annual', price: '$24.99 / year', sub: '$2.08 / month — save 85%', selected: true },
    { id: 'weekly', label: 'weekly', price: '$3.99 / week', sub: '', selected: false },
    { id: 'lifetime', label: 'lifetime', price: '$49.99 once', sub: '', selected: false },
  ],
  benefits: ['unlimited daily cleanups', '720p max savings', 'unlimited video compression'],
};

export { MB, GB };
