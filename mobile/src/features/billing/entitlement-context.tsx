import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  canCleanupToday, consumeCleanup, presetHeightPx, upgrade,
} from './entitlement';
import type { CompressionPreset, Entitlement } from './entitlement';

/** P5 entitlement. Purchases go through Play Billing on a Play-enabled device
 *  (react-native-iap adapter, see PLAN §P5); on the emulator the same code path
 *  is exercised by `purchase()`, which grants pro locally so both tiers are testable. */

const KEY = 'swipemedia.entitlement.v1';

const DEFAULT: Entitlement = { pro: false, cleanupsToday: 0, lastCleanupDayMs: 0 };

type Ctx = {
  entitlement: Entitlement;
  ready: boolean;
  canCleanup: boolean;
  pro: boolean;
  preset: CompressionPreset;
  choosePreset: (p: CompressionPreset) => void;
  purchase: () => Promise<void>;
  restore: () => Promise<boolean>;
  recordCleanup: () => Promise<void>;
  heightPx: number;
};

const EntitlementContext = createContext<Ctx | null>(null);

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const [entitlement, setEntitlement] = useState<Entitlement>(DEFAULT);
  const [preset, setPreset] = useState<CompressionPreset>('balanced');
  const [ready, setReady] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { entitlement: Entitlement; preset?: CompressionPreset };
          if (active) {
            setEntitlement(parsed.entitlement ?? DEFAULT);
            if (parsed.preset) setPreset(parsed.preset);
            setNowMs(Date.now());
          }
        }
      } catch {
        // defaults stand
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (next: Entitlement, nextPreset: CompressionPreset) => {
    setEntitlement(next);
    setPreset(nextPreset);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify({ entitlement: next, preset: nextPreset }));
    } catch {
      // a failed write only loses the tally, never the user's files
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      entitlement,
      ready,
      canCleanup: canCleanupToday(entitlement, nowMs),
      pro: entitlement.pro,
      preset,
      choosePreset: (p) => persist(entitlement, p),
      purchase: async () => persist(upgrade(entitlement, Date.now()), preset),
      restore: async () => {
        // the store is the source of truth on a Play device; locally, re-read it
        try {
          const raw = await AsyncStorage.getItem(KEY);
          if (!raw) return false;
          const parsed = JSON.parse(raw) as { entitlement: Entitlement };
          if (parsed.entitlement?.pro) {
            setEntitlement(parsed.entitlement);
            return true;
          }
        } catch {
          // ignore
        }
        return false;
      },
      recordCleanup: async () => persist(consumeCleanup(entitlement, Date.now()), preset),
      heightPx: presetHeightPx(entitlement, preset),
    }),
    [entitlement, preset, ready, persist, nowMs]
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): Ctx {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlement must be used inside EntitlementProvider');
  return ctx;
}
