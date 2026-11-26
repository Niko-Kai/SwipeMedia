// MediaStore access via the SDK 58 expo-media-library (new Query builder API).
// Notes from the API surface: Asset.id on Android IS the content:// URI;
// creationTime is in SECONDS; sizes are not exposed -> mediatools.getSizes.
import {
  AssetField,
  MediaType,
  Query,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-media-library';
import type { GranularPermission } from 'expo-media-library';
import { getSizes } from '../../../modules/mediatools/src';
import { toMsIfSeconds, toSecondsIfMs } from '@/lib/dates';

export type MediaAsset = {
  id: string;
  uri: string;
  filename: string;
  sizeBytes: number;
  mediaType: 'photo' | 'video';
  createdAtMs: number;
  /** video duration in seconds */
  durationSec: number | null;
};

export type LibraryPermission = 'granted' | 'denied' | 'blocked' | 'undetermined';

function toPermissionStatus(resp: { granted: boolean; canAskAgain: boolean }): LibraryPermission {
  if (resp.granted) return 'granted';
  if (!resp.canAskAgain) return 'blocked';
  return 'denied';
}

/** spec: Photos & Videos only — never audio (the library's default adds it). */
const GRANULAR: GranularPermission[] = ['photo', 'video'];

export async function getLibraryPermissionStatus(): Promise<LibraryPermission> {
  return toPermissionStatus(await getPermissionsAsync(false, GRANULAR));
}

export async function requestLibraryPermission(): Promise<LibraryPermission> {
  return toPermissionStatus(await requestPermissionsAsync(false, GRANULAR));
}

export type FetchAssetsOptions = {
  sinceMs?: number;
  untilMs?: number;
  mediaType?: 'photo' | 'video';
  /** shortcut: single fetch, newest first; P6 moves scope stats into native queries */
  limit?: number;
};

/** Fetch media assets normalized for the app (newest first). */
export async function fetchMediaAssets(opts: FetchAssetsOptions = {}): Promise<MediaAsset[]> {
  const q = new Query()
    .limit(opts.limit ?? 500)
    .orderBy({ key: AssetField.CREATION_TIME, ascending: false });

  if (opts.sinceMs !== undefined) {
    q.gte(AssetField.CREATION_TIME, Math.floor(opts.sinceMs / 1000));
  }
  if (opts.untilMs !== undefined) {
    q.lte(AssetField.CREATION_TIME, Math.floor(opts.untilMs / 1000));
  }
  if (opts.mediaType === 'photo') {
    q.eq(AssetField.MEDIA_TYPE, MediaType.IMAGE);
  }
  if (opts.mediaType === 'video') {
    q.eq(AssetField.MEDIA_TYPE, MediaType.VIDEO);
  }

  const metas = await q.exeForMetadata();
  if (metas.length === 0) return [];

  // Android MediaStore returns creationTime in ms despite the API docs saying
  // seconds — toMsIfSeconds accepts either.
  const sizes = await getSizes(metas.map((m) => m.id));

  return metas.map((meta, i) => ({
    id: meta.id,
    uri: meta.id,
    filename: meta.filename ?? 'unnamed',
    sizeBytes: Math.max(0, sizes[i] ?? 0),
    mediaType: meta.mediaType === MediaType.VIDEO ? 'video' : 'photo',
    // creationTime can be absent on Android rows created by a scan; the
    // modification time is the honest fallback for "when is this from".
    createdAtMs: toMsIfSeconds(meta.creationTime ?? meta.modificationTime ?? 0),
    durationSec: meta.duration === null ? null : toSecondsIfMs(meta.duration),
  }));
}
