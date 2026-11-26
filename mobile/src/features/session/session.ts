// Staged session state machine for the swipe deck (user_flow.md v4 §3, PLAN §2).
// Everything here stays in-memory until 04 confirm applies — "nothing changes
// until you apply" is a spec global rule. Pure, tested against the ledger §4.

export type MediaAsset = {
  id: string;
  uri: string;
  filename: string;
  sizeBytes: number;
  mediaType: 'photo' | 'video';
  createdAtMs: number;
  durationSec: number | null;
};

export type StagedCompress = { item: MediaAsset; newSizeBytes: number };

export type LastAction = { kind: 'remove' | 'compress'; index: number } | null;

export type SessionState = {
  queue: MediaAsset[];
  index: number;
  removed: MediaAsset[];
  compressed: StagedCompress[];
  lastAction: LastAction;
};

export type SessionAction =
  | { type: 'replace'; queue: MediaAsset[] }
  | { type: 'remove'; item: MediaAsset }
  | { type: 'compress'; item: MediaAsset; newSizeBytes: number }
  | { type: 'keep' }
  | { type: 'previous' }
  | { type: 'undo' };

export function createSession(queue: MediaAsset[]): SessionState {
  return { queue, index: 0, removed: [], compressed: [], lastAction: null };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'replace':
      return createSession(action.queue);
    case 'keep':
      return { ...state, index: state.index + 1 };
    case 'previous':
      return { ...state, index: Math.max(0, state.index - 1) };
    case 'remove':
      return {
        ...state,
        removed: [...state.removed, action.item],
        index: state.index + 1,
        lastAction: { kind: 'remove', index: state.removed.length },
      };
    case 'compress':
      return {
        ...state,
        compressed: [...state.compressed, { item: action.item, newSizeBytes: action.newSizeBytes }],
        index: state.index + 1,
        lastAction: { kind: 'compress', index: state.compressed.length },
      };
    case 'undo': {
      if (!state.lastAction) return state;
      if (state.lastAction.kind === 'remove') {
        return {
          ...state,
          removed: state.removed.slice(0, -1),
          index: Math.max(0, state.index - 1),
          lastAction: null,
        };
      }
      return {
        ...state,
        compressed: state.compressed.slice(0, -1),
        index: Math.max(0, state.index - 1),
        lastAction: null,
      };
    }
  }
}

/** staged bytes this session would free: removals + compress savings */
export function sessionFreedBytes(s: SessionState): number {
  const removedBytes = s.removed.reduce((sum, a) => sum + a.sizeBytes, 0);
  const compressBytes = s.compressed.reduce((sum, c) => sum + (c.item.sizeBytes - c.newSizeBytes), 0);
  return removedBytes + compressBytes;
}

/** 03's tally: cumulative saved-so-far plus this session's staged bytes */
export function savedPlusSession(savedSoFarBytes: number, s: SessionState): number {
  return savedSoFarBytes + sessionFreedBytes(s);
}

/** every removal + every compressed ORIGINAL lands in trash (one batch at apply) */
export function trashCount(s: SessionState): number {
  return s.removed.length + s.compressed.length;
}

export function progressLabel(s: SessionState): string {
  const shown = Math.min(s.index + 1, s.queue.length);
  return `${shown} of ${s.queue.length}`;
}

export function isDeckFinished(s: SessionState): boolean {
  return s.index >= s.queue.length;
}
