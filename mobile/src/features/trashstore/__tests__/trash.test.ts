import {
  daysLeft, heldRows, trashBytes, TRASH_HOLD_DAYS,
} from '../trash-core';
import type { TrashRow } from '../trash-core';

const now = Date.now();
const day = 864e5;

const row = (over: Partial<TrashRow>): TrashRow => ({
  id: 'content://media/a/1',
  uri: 'content://media/a/1',
  filename: 'IMG_1.jpg',
  sizeBytes: 1024,
  mediaType: 'photo',
  trashedAtMs: now - day, // trashed yesterday by default
  ...over,
});

// Breaks caught: wrong day rounding, the 30-day boundary, expired rows leaking
// into the "held" list, byte totals.
describe('trash daysLeft', () => {
  test('freshly trashed row has the full 30 days', () => {
    expect(daysLeft(row({ trashedAtMs: now }), now)).toBe(TRASH_HOLD_DAYS);
  });

  test('counts down whole days; hits 0 at the full 30', () => {
    expect(daysLeft(row({ trashedAtMs: now - 30 * day }), now)).toBe(0);
    expect(daysLeft(row({ trashedAtMs: now - 30 * day - 1 }), now)).toBe(0);
    expect(daysLeft(row({ trashedAtMs: now - 5 * day }), now)).toBe(25);
  });

  test('29d chip shows for the spec preview rows', () => {
    expect(daysLeft(row({ trashedAtMs: now - day }), now)).toBe(29);
  });
});

describe('heldRows', () => {
  test('expired rows drop out of the held list', () => {
    const rows = [
      row({ id: 'a', trashedAtMs: now - 29 * day }),
      row({ id: 'b', trashedAtMs: now - 31 * day }),
    ];
    const held = heldRows(rows, now);
    expect(held.map((r) => r.id)).toEqual(['a']);
  });

  test('byte totals cover the held rows', () => {
    const rows = [
      row({ id: 'a', sizeBytes: 4.2 * 1024 ** 2 }),
      row({ id: 'b', sizeBytes: 96.3 * 1024 ** 2 }),
    ];
    expect(trashBytes(heldRows(rows, now))).toBeCloseTo(100.5 * 1024 ** 2, 6);
  });
});
