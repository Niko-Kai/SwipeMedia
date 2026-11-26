import { useEffect, useMemo, useState } from 'react';
import { fetchMediaAssets } from './library';
import type { MediaAsset } from './library';
import { isToday, isScreenshot, scopeStats } from '@/features/scopes/scopes';
import { getStorageStats } from '../../../modules/mediatools/src';
import type { StorageStats } from '../../../modules/mediatools/src';
import { loadTotalSaved, loadTrashRows } from '@/features/trashstore/trash';

export type DashboardState = {
  loading: boolean;
  assets: MediaAsset[];
  storage: StorageStats | null;
  /** captured once per load so scope math and UI agree (and render stays pure) */
  nowMs: number;
  /** saved-so-far starts at 0; sessions persist from P3 onward */
  savedSoFarBytes: number;
  trashItems: number;
};

/** Real library data: one fetch, aggregation in tested pure code (P1). */
export function useDashboardData(): DashboardState & {
  stats: ReturnType<typeof scopeStats>;
  todayAssets: MediaAsset[];
  screenshotAssets: MediaAsset[];
} {
  const [state, setState] = useState<DashboardState>(() => ({
    loading: true,
    assets: [],
    storage: null,
    nowMs: Date.now(),
    savedSoFarBytes: 0,
    trashItems: 0,
  }));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const results = await Promise.all([
          fetchMediaAssets({ limit: 1000 }),
          getStorageStats(),
          loadTotalSaved(),
          loadTrashRows(),
        ]);
        const [assets, storage, saved, trashRows] = results;
        if (active) {
          setState({
            loading: false,
            assets,
            storage,
            nowMs: Date.now(),
            savedSoFarBytes: saved,
            trashItems: trashRows.length,
          });
        }
      } catch (e) {
        // surfaced via logcat while in dev; the UI shows the empty state
        console.error('library load failed', e);
        if (active) {
          setState({ loading: false, assets: [], storage: null, nowMs: Date.now(), savedSoFarBytes: 0, trashItems: 0 });
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => scopeStats(state.assets, state.nowMs), [state.assets, state.nowMs]);
  const todayAssets = useMemo(() => state.assets.filter((a) => isToday(a, state.nowMs)), [state.assets, state.nowMs]);
  const screenshotAssets = useMemo(() => state.assets.filter((a) => isScreenshot(a)), [state.assets]);

  return { ...state, stats, todayAssets, screenshotAssets };
}
