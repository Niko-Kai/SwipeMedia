import { formatBytes } from '../bytes';

// Ledger fixtures from dev-data/user_flow.md §4 — hand-derived, one decimal.
// Breaks caught: wrong unit boundary, rounding, decimal place, MB/GB suffix.
describe('formatBytes', () => {
  test('renders gigabytes with one decimal', () => {
    expect(formatBytes(1.8 * 1024 ** 3)).toBe('1.8 GB');
    expect(formatBytes(12.4 * 1024 ** 3)).toBe('12.4 GB');
    expect(formatBytes(9.4 * 1024 ** 3)).toBe('9.4 GB');
  });

  test('renders megabytes with one explicit decimal place', () => {
    expect(formatBytes(600 * 1024 ** 2)).toBe('600.0 MB');
    expect(formatBytes(4.2 * 1024 ** 2)).toBe('4.2 MB');
    expect(formatBytes(35.7 * 1024 ** 2)).toBe('35.7 MB');
    expect(formatBytes(48.6 * 1024 ** 2)).toBe('48.6 MB');
  });

  test('picks the largest unit that keeps one decimal of meaning', () => {
    expect(formatBytes(1024 ** 3)).toBe('1.0 GB');
    expect(formatBytes(1023.5 * 1024 ** 2)).toBe('1023.5 MB');
    expect(formatBytes(18.4 * 1024 ** 2)).toBe('18.4 MB');
  });

  test('renders kilobytes and small byte counts', () => {
    expect(formatBytes(2.8 * 1024 ** 2)).toBe('2.8 MB');
    expect(formatBytes(1.5 * 1024)).toBe('1.5 KB');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(64)).toBe('64 B');
  });
});
