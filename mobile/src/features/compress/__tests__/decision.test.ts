import { compressDecision } from '../decision';

// Breaks caught: charging free users a transcode they didn't buy, claiming
// savings when the transcode grew the file, compressing photos.
describe('compressDecision (deck compress)', () => {
  test('free users are upsold, never transcoded', () => {
    expect(
      compressDecision({ pro: false, mediaType: 'video', originalBytes: 1000, resultBytes: 400 })
    ).toEqual({ kind: 'upsell' });
  });

  test('photos are unsupported even for pro', () => {
    expect(
      compressDecision({ pro: true, mediaType: 'photo', originalBytes: 1000 })
    ).toEqual({ kind: 'unsupported' });
  });

  test('a genuinely smaller transcode is staged with the real saving', () => {
    expect(
      compressDecision({ pro: true, mediaType: 'video', originalBytes: 1000, resultBytes: 400 })
    ).toEqual({ kind: 'staged', savedBytes: 600, newSizeBytes: 400 });
  });

  test('a larger transcode keeps the original and claims nothing', () => {
    expect(
      compressDecision({ pro: true, mediaType: 'video', originalBytes: 1000, resultBytes: 1200 })
    ).toEqual({ kind: 'kept' });
  });

  test('an equal-size transcode also keeps the original', () => {
    expect(
      compressDecision({ pro: true, mediaType: 'video', originalBytes: 1000, resultBytes: 1000 })
    ).toEqual({ kind: 'kept' });
  });
});
