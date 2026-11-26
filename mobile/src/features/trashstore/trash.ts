// Async persistence shell for the trash ledger (pure logic in trash-core.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrashRow } from './trash-core';

const STORE_KEY = 'swipemedia.trash.v1';

export type { TrashRow } from './trash-core';
export { daysLeft, heldRows, trashBytes, TRASH_HOLD_DAYS } from './trash-core';

export async function loadTrashRows(): Promise<TrashRow[]> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTrashRows(rows: TrashRow[]): Promise<void> {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(rows));
}

export async function addTrashRows(rows: TrashRow[]): Promise<TrashRow[]> {
  const all = await loadTrashRows();
  const merged = [...all, ...rows];
  await saveTrashRows(merged);
  return merged;
}

export async function removeTrashRows(ids: string[]): Promise<TrashRow[]> {
  const all = await loadTrashRows();
  const kept = all.filter((r) => !ids.includes(r.id));
  await saveTrashRows(kept);
  return kept;
}

export async function clearTrash(): Promise<void> {
  await saveTrashRows([]);
}

const SAVED_KEY = 'swipemedia.saved.v1';

/** cumulative "saved so far" — grows on apply (the spec keeps trashed bytes
 *  counted as saved even while they still occupy disk; 04b/01b say so). */
export async function loadTotalSaved(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function addSaved(bytes: number): Promise<number> {
  const next = (await loadTotalSaved()) + Math.max(0, bytes);
  await AsyncStorage.setItem(SAVED_KEY, String(next));
  return next;
}
