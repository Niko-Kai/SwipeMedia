// Pure trash-store logic — system truth stays in MediaStore; this ledger
// tracks what the app itself trashed and the 30-day hold (user_flow v4 §1b).

export type TrashRow = {
  id: string;
  uri: string;
  filename: string;
  sizeBytes: number;
  mediaType: 'photo' | 'video';
  /** when the batch apply ran */
  trashedAtMs: number;
};

export const TRASH_HOLD_DAYS = 30;

/** days of the 30-day hold left, rounded down; 0 surfaces when expired */
export function daysLeft(row: TrashRow, nowMs: number): number {
  const elapsedDays = Math.floor((nowMs - row.trashedAtMs) / 864e5);
  return Math.max(0, TRASH_HOLD_DAYS - elapsedDays);
}

/** trashed rows still within their hold */
export function heldRows(rows: TrashRow[], nowMs: number): TrashRow[] {
  return rows.filter((r) => nowMs - r.trashedAtMs < TRASH_HOLD_DAYS * 864e5);
}

export function trashBytes(rows: TrashRow[]): number {
  return rows.reduce((sum, r) => sum + r.sizeBytes, 0);
}
