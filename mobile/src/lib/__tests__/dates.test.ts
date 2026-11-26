import { monthGrid, weeksForMonth, isSameLocalDay, toMsIfSeconds, toSecondsIfMs } from '../dates';

// Production change that would break these: wrong month offset (Monday-first),
// wrong padding (leading blanks / trailing dims), wrong week count.
describe('monthGrid (Monday-first, per the spec calendar sheet)', () => {
  test('June 2026 starts on Monday: no leading blanks, 30 days, trailing July 1-5 dimmed', () => {
    const grid = monthGrid(2026, 5); // month 5 = June (0-based)
    expect(grid.leadingBlanks).toBe(0);
    expect(grid.daysInMonth).toBe(30);
    expect(grid.weeks).toBe(5);
    expect(grid.trailing).toEqual([1, 2, 3, 4, 5]);
    expect(grid.cells.length).toBe(35);
  });

  test('July 2026 starts on Wednesday: 2 leading blanks, 31 days, 2 trailing dims, 5 weeks', () => {
    const grid = monthGrid(2026, 6);
    expect(grid.leadingBlanks).toBe(2);
    expect(grid.daysInMonth).toBe(31);
    expect(grid.weeks).toBe(5);
    expect(grid.trailing).toEqual([1, 2]);
    expect(grid.cells.length).toBe(35);
  });

  test('a 31-day month starting Saturday spans 6 weeks', () => {
    // August 2026: Aug 1 is a Saturday
    const grid = monthGrid(2026, 7);
    expect(grid.leadingBlanks).toBe(5);
    expect(grid.weeks).toBe(6);
  });

  test('weekday header is Monday-first', () => {
    expect(monthGrid(2026, 5).weekdays).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
  });
});

describe('weeksForMonth', () => {
  test('empty month offset math', () => {
    expect(weeksForMonth(1, 30)).toBe(5); // June 2026
    expect(weeksForMonth(2, 31)).toBe(5); // July 2026
    expect(weeksForMonth(5, 31)).toBe(6); // August 2026
    expect(weeksForMonth(6, 28)).toBe(5); // Feb 2027 (starts Sunday)
  });
});

describe('toMsIfSeconds', () => {
  test('milliseconds pass through unchanged (Android MediaStore reality)', () => {
    expect(toMsIfSeconds(1795612238000)).toBe(1795612238000);
  });
  test('seconds (per the API docs) convert to ms', () => {
    expect(toMsIfSeconds(1795612238)).toBe(1795612238000);
  });
});

describe('toSecondsIfMs', () => {
  test('a 12s clip from MediaStore arrives as 12000 ms', () => {
    expect(toSecondsIfMs(12000)).toBe(12);
  });
  test('a value already in seconds stays put', () => {
    expect(toSecondsIfMs(12)).toBe(12);
  });
});

describe('isSameLocalDay', () => {
  test('same calendar day regardless of time', () => {
    expect(isSameLocalDay(new Date(2026, 10, 25, 1, 0).getTime(), new Date(2026, 10, 25, 23, 0).getTime())).toBe(true);
  });
  test('different calendar days', () => {
    expect(isSameLocalDay(new Date(2026, 10, 25, 1, 0).getTime(), new Date(2026, 10, 26, 1, 0).getTime())).toBe(false);
  });
  test('day boundary is local midnight', () => {
    const nearMidnight = new Date(2026, 10, 25, 23, 59).getTime();
    const justAfter = new Date(2026, 10, 26, 0, 1).getTime();
    expect(isSameLocalDay(nearMidnight, justAfter)).toBe(false);
  });
});
