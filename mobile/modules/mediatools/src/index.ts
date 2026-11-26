import { requireNativeModule } from 'expo';

export type StorageStats = { totalBytes: number; freeBytes: number };
export type CompressResult = { uri: string; sizeBytes: number };

type MediaToolsNativeModule = {
  getStorageStats(): Promise<StorageStats>;
  getSizes(uris: string[]): Promise<number[]>;
  requestTrash(uris: string[], trash: boolean): Promise<{ granted: boolean }>;
  requestDelete(uris: string[]): Promise<{ granted: boolean }>;
  compressVideo(uri: string, heightPx: number): Promise<CompressResult>;
  stopCompression(): Promise<boolean>;
};

const MediaTools = requireNativeModule<MediaToolsNativeModule>('MediaTools');

export function getStorageStats(): Promise<StorageStats> {
  return MediaTools.getStorageStats();
}

/** Batch file sizes via the MediaStore SIZE column; -1 entries mean "unavailable". */
export function getSizes(uris: string[]): Promise<number[]> {
  return MediaTools.getSizes(uris);
}

/** ONE system dialog for the whole batch (spec 04a); resolves granted true/false. */
export function requestTrash(uris: string[], trash: boolean): Promise<{ granted: boolean }> {
  return MediaTools.requestTrash(uris, trash);
}

/** Permanent delete of already-trashed items, one dialog for the batch ("empty trash"). */
export function requestDelete(uris: string[]): Promise<{ granted: boolean }> {
  return MediaTools.requestDelete(uris);
}

/** On-device transcode (MediaTransformer) to the preset height; 1080 or 720. */
export function compressVideo(uri: string, heightPx: number): Promise<CompressResult> {
  return MediaTools.compressVideo(uri, heightPx);
}

export function stopCompression(): Promise<boolean> {
  return MediaTools.stopCompression();
}
