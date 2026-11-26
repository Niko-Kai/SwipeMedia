// The deck's compress decision, kept pure so the money/quality rules are testable.
// Spec: free users are upsold (05), compression is a video capability, and the
// app never claims a saving a transcode did not produce.

export type CompressDecision =
  | { kind: 'upsell' }
  | { kind: 'unsupported' }
  | { kind: 'staged'; savedBytes: number; newSizeBytes: number }
  | { kind: 'kept' };

export function compressDecision(opts: {
  pro: boolean;
  mediaType: 'photo' | 'video';
  originalBytes: number;
  resultBytes?: number;
}): CompressDecision {
  if (!opts.pro) return { kind: 'upsell' };
  if (opts.mediaType !== 'video') return { kind: 'unsupported' };
  const resultBytes = opts.resultBytes;
  if (resultBytes === undefined) return { kind: 'unsupported' };
  const saved = opts.originalBytes - resultBytes;
  if (saved <= 0) return { kind: 'kept' };
  return { kind: 'staged', savedBytes: saved, newSizeBytes: resultBytes };
}
