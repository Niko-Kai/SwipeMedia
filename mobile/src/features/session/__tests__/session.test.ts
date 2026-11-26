import {
  sessionReducer, createSession, savedPlusSession, sessionFreedBytes, trashCount,
  progressLabel, isDeckFinished,
} from '../session';
import type { MediaAsset } from '../session';
import { formatBytes } from '@/lib/bytes';

const MB = 1024 ** 2;
const NOW = new Date(2026, 10, 26, 12, 0).getTime();

const asset = (over: Partial<MediaAsset>): MediaAsset => ({
  id: `content://media/a/${Math.random()}`,
  uri: 'content://media/external/images/media/1',
  filename: 'IMG_2481.HEIC',
  sizeBytes: 4.2 * MB,
  mediaType: 'photo',
  createdAtMs: NOW,
  durationSec: null,
  ...over,
});

// Breaks caught: wrong staging math (the spec's ledger §4), undo not one level,
// index boundaries, trash count including compressed originals.
describe('session reducer (the staged deck)', () => {
  test('remove stages the item and advances', () => {
    const queue = [asset({}), asset({ filename: 'IMG_2482.HEIC' })];
    let s = createSession(queue);
    s = sessionReducer(s, { type: 'remove', item: queue[0] });
    expect(s.removed).toHaveLength(1);
    expect(s.removed[0].id).toBe(queue[0].id);
    expect(s.index).toBe(1);
    expect(s.compressed).toHaveLength(0);
  });

  test('tally matches the ledger: 600.0 MB base + 4.2 MB remove = 604.2', () => {
    let s = createSession([asset({})]);
    s = sessionReducer(s, { type: 'remove', item: s.queue[0] });
    expect(sessionFreedBytes(s)).toBeCloseTo(4.2 * MB, 6);
    expect(savedPlusSession(600.0 * MB, s)).toBeCloseTo(604.2 * MB, 6);
  });

  test('compress stages original-to-trash + freed delta (48.6 -> 12.9 = 35.7)', () => {
    const video = asset({ filename: 'IMG_2494.MOV', sizeBytes: 48.6 * MB, mediaType: 'video' });
    let s = createSession([video]);
    s = sessionReducer(s, { type: 'compress', item: video, newSizeBytes: 12.9 * MB });
    expect(sessionFreedBytes(s)).toBeCloseTo(35.7 * MB, 6);
    expect(s.compressed).toHaveLength(1);
  });

  test('undo reverses exactly one action (last remove or compress)', () => {
    const a = asset({ filename: 'A.jpg' });
    const b = asset({ filename: 'B.MOV', sizeBytes: 48.6 * MB, mediaType: 'video' });
    let s = createSession([a, b]);
    s = sessionReducer(s, { type: 'remove', item: a });
    s = sessionReducer(s, { type: 'compress', item: b, newSizeBytes: 12.9 * MB });
    s = sessionReducer(s, { type: 'undo' });
    expect(s.compressed).toHaveLength(0); // the compress came back out
    expect(s.removed).toHaveLength(1); // the remove stays
    expect(s.index).toBe(1);
    // one-level undo per spec: a second press has nothing left to reverse
    s = sessionReducer(s, { type: 'undo' });
    expect(s.compressed).toHaveLength(0);
    expect(s.removed).toHaveLength(1);
    expect(s.index).toBe(1);
  });

  test('keeping advances; previous clamps at the first item', () => {
    let s = createSession([asset({}), asset({}), asset({})]);
    expect(progressLabel(s)).toBe('1 of 3');
    s = sessionReducer(s, { type: 'keep' });
    expect(progressLabel(s)).toBe('2 of 3');
    s = sessionReducer(s, { type: 'previous' });
    s = sessionReducer(s, { type: 'previous' });
    expect(progressLabel(s)).toBe('1 of 3');
    expect(isDeckFinished(s)).toBe(false);
  });

  test('deck finishes after acting or keeping on the last card', () => {
    const only = asset({});
    let s = createSession([only]);
    s = sessionReducer(s, { type: 'keep' });
    expect(isDeckFinished(s)).toBe(true);
  });

  test('ledger parity: 24 removed (1.2 GB) + 12 compressed (600.0 MB freed) displays as 1.8 GB, trash 36', () => {
    // the ledger's parts reconcile through the display formatter: the byte sum
    // (1.2 GiB + 600.0 MB) formats back to the spec's headline "1.8 GB".
    const removed = Array.from({ length: 24 }, (_, i) =>
      asset({ filename: `r${i}.jpg`, sizeBytes: (1.2 * 1024 ** 3) / 24 })
    );
    const queue = [
      ...removed,
      ...Array.from({ length: 12 }, (_, i) =>
        asset({ filename: `v${i}.MOV`, sizeBytes: 100 * MB, mediaType: 'video' })
      ),
    ];
    let s = createSession(queue);
    for (const item of removed) s = sessionReducer(s, { type: 'remove', item });
    for (let i = 24; i < 36; i++) {
      s = sessionReducer(s, { type: 'compress', item: queue[i], newSizeBytes: 50 * MB });
    }
    expect(formatBytes(sessionFreedBytes(s))).toBe('1.8 GB');
    expect(trashCount(s)).toBe(36);
  });
});
