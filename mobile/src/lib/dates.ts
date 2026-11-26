// Local-date helpers for the calendar sheet and scope windows.
// All math is done through Date objects (DST-safe), not raw ms subtraction.

export function startOfDayLocal(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function isSameLocalDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function weeksForMonth(leadingBlanks: number, daysInMonth: number): number {
  return Math.ceil((leadingBlanks + daysInMonth) / 7);
}

/** Platform truth mismatch: expo-media-library documents creationTime in seconds,
 *  Android MediaStore returns milliseconds. Accept either; flag the unit by magnitude. */
export function toMsIfSeconds(value: number): number {
  return value > 1e12 ? value : value * 1000;
}

/** Same mismatch for video duration (MediaStore returns ms). Videos of >= 1s
 *  are >= 1000 in ms, so the boundary is safe for anything a cleaner will see. */
export function toSecondsIfMs(value: number): number {
  return value >= 1000 ? value / 1000 : value;
}

export type MonthGrid = {
  leadingBlanks: number;
  daysInMonth: number;
  weeks: number;
  /** day numbers of the next month that fill the last row, dimmed */
  trailing: number[];
  /** flattened grid: 0 = blank, positive = day of month */
  cells: number[];
  weekdays: string[];
};

/** Monday-first month grid (the spec's calendar sheet). `month` is 0-based. */
export function monthGrid(year: number, month: number): MonthGrid {
  const first = new Date(year, month, 1);
  const leadingBlanks = (first.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = weeksForMonth(leadingBlanks, daysInMonth);
  const cells: number[] = [
    ...Array.from({ length: leadingBlanks }, () => 0),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const trailing: number[] = [];
  while (cells.length < weeks * 7) {
    trailing.push(trailing.length + 1);
    cells.push(0); // trailing days render dimmed, driven by `trailing`
  }
  return { leadingBlanks, daysInMonth, weeks, trailing, cells, weekdays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] };
}
