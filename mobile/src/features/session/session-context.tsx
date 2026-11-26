import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createSession, sessionReducer, sessionFreedBytes, savedPlusSession,
  trashCount, progressLabel, isDeckFinished,
} from './session';
import type { MediaAsset, SessionAction, SessionState } from './session';

/** One staged session lives across the 03 deck -> 04 confirm -> apply flow
 *  (PLAN §2). Nothing real happens until apply (P3 wiring); this is staging. */

type SessionContextValue = {
  state: SessionState;
  start: (queue: MediaAsset[]) => void;
  dispatch: (action: SessionAction) => void;
  freedBytes: number;
  tally: (savedSoFarBytes: number) => number;
  trashItems: number;
  deckLabel: string;
  finished: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const SNAPSHOT_KEY = 'swipemedia.session.v1';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, [], createSession);

  // resume an interrupted batch after a cold start (spec: the queue survives)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw) as SessionState;
        if (active && saved.queue?.length > 0) {
          dispatch({ type: 'replace', queue: saved.queue });
          for (const item of saved.removed) dispatch({ type: 'remove', item });
          for (const c of saved.compressed) {
            dispatch({ type: 'compress', item: c.item, newSizeBytes: c.newSizeBytes });
          }
        }
      } catch {
        // a corrupt snapshot just starts a fresh session
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // snapshot every staged change (cheap; batches are small)
  useEffect(() => {
    if (state.queue.length === 0) return;
    AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      start: (queue: MediaAsset[]) => dispatch({ type: 'replace', queue }),
      dispatch,
      freedBytes: sessionFreedBytes(state),
      tally: (savedSoFarBytes: number) => savedPlusSession(savedSoFarBytes, state),
      trashItems: trashCount(state),
      deckLabel: progressLabel(state),
      finished: isDeckFinished(state),
    }),
    [state]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
