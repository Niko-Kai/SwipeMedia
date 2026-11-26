import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, withSpring } from 'react-native-reanimated';
import { HeaderRow, MeterBar, Screen, Toast } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { useDashboardData } from '@/features/media/useDashboardData';
import { useSession } from '@/features/session/session-context';
import { useEntitlement } from '@/features/billing/entitlement-context';
import { compressDecision } from '@/features/compress/decision';
import { compressVideo } from '../../modules/mediatools/src';

/** 03 swipe — the core loop with real gestures (P2).
 *  up = stage-remove · left = previous · right = keep/advance (spec; no down).
 *  Everything is staged in the session context; apply happens in 04 (P3).
 *  setSystemGestureExclusionRects is not in RN core (spike): threshold-based
 *  gesture activation + the 24px card inset keep edge-back out of the fight. */
export default function Swipe() {
  const router = useRouter();
  const { todayAssets: queue, loading } = useDashboardData();
  const { state, start, dispatch, tally } = useSession();
  const { pro, heightPx } = useEntitlement();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2400);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const stampOpacity = useSharedValue(0);

  // mount a fresh deck for today's scope unless an in-progress deck matches it
  useEffect(() => {
    if (queue.length === 0) return;
    const sameQueue =
      state.queue.length === queue.length && state.queue[0]?.id === queue[0]?.id;
    const finished = state.queue.length > 0 && state.index >= state.queue.length;
    if (!sameQueue || finished) start(queue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length]);

  const current = state.queue[state.index];
  const stagedSaved = tally(0);

  /** deck compress: pro transcode in place; free users get the upsell (spec 05). */
  const compressCurrent = async () => {
    if (compressing) return;
    if (!pro) {
      router.push('/paywall'); // spec 05: free users are upsold
      return;
    }
    if (!current) return;
    if (current.mediaType !== 'video') {
      setToastMsg('compress works on videos');
      return;
    }

    setCompressing(true);
    try {
      const result = await compressVideo(current.uri, heightPx);
      const decision = compressDecision({
        pro,
        mediaType: current.mediaType,
        originalBytes: current.sizeBytes,
        resultBytes: result.sizeBytes,
      });
      if (decision.kind === 'staged') {
        dispatch({ type: 'compress', item: current, newSizeBytes: decision.newSizeBytes });
        setToastMsg(`video compressed · ${formatBytes(decision.savedBytes)} freed`);
      } else {
        dispatch({ type: 'keep' });
        setToastMsg('already efficient — kept the original');
      }
      if (state.index + 1 >= state.queue.length) router.replace('/confirm');
    } catch (e) {
      console.error('deck compress failed', e);
      setToastMsg('compression failed — nothing changed');
    } finally {
      setCompressing(false);
    }
  };

  const act = useCallback(
    (kind: 'remove' | 'keep' | 'previous') => {
      const item = state.queue[Math.min(state.index, state.queue.length - 1)];
      if (!item) return;
      if (kind === 'remove') {
        dispatch({ type: 'remove', item });
        setToastMsg(`moved to trash · ${formatBytes(item.sizeBytes)} freed`);
      } else if (kind === 'keep') {
        dispatch({ type: 'keep' });
      } else {
        dispatch({ type: 'previous' });
        return; // going back never finishes the deck
      }
      // advancing past the last card ends the session -> 04 confirm
      if (state.index + 1 >= state.queue.length) {
        router.replace('/confirm');
      }
    },
    [state.queue, state.index, dispatch, router]
  );

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      stampOpacity.value = Math.min(1, Math.max(0, -e.translationY / 90));
    })
    .onEnd((e) => {
      const up = e.translationY < -90 && Math.abs(e.translationX) < 70;
      const left = e.translationX < -80 && Math.abs(e.translationY) < 70;
      const right = e.translationX > 80 && Math.abs(e.translationY) < 70;
      tx.value = withSpring(0);
      ty.value = withSpring(0);
      stampOpacity.value = withSpring(0);
      if (up) runOnJS(act)('remove');
      else if (right) runOnJS(act)('keep');
      else if (left) runOnJS(act)('previous');
    });

  // navigation to 04 happens in act() when the last card is passed; no
  // mount-time redirect here (that raced the fresh-deck reset).

  return (
    <Screen>
      <HeaderRow
        right={
          <Ionicons name="images-outline" size={22} color={colors.text} accessibilityLabel="open gallery" onPress={() => router.push('/gallery')} />
        }
      />

      <View style={s.deckArea}>
        {/* next card peeking behind the active one (v4 stacked deck) */}
        <View style={s.cardBehind} pointerEvents="none" />
        <View style={s.mediaCard}>
          {current ? (
            <>
              {/* stamp + filename overlay the media (v4 draws them on the image) */}
              <View style={s.overlayTop}>
                <Text style={s.stamp}>↑ remove</Text>
              </View>
              <GestureDetector gesture={pan}>
                <View style={s.mediaWrap}>
                  <Image source={{ uri: current.uri }} style={s.media} contentFit="cover" />
                  {current.mediaType === 'video' && (
                    <View style={s.durationChip}>
                      <Text style={s.durationText}>
                        {Math.floor((current.durationSec ?? 0) / 60)}:{String(Math.floor((current.durationSec ?? 0) % 60)).padStart(2, '0')}
                      </Text>
                    </View>
                  )}
                </View>
              </GestureDetector>
              <View style={s.overlayBottom}>
                <Text style={[type.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>{current.filename}</Text>
                <Text style={type.meta}>{formatBytes(current.sizeBytes)}</Text>
              </View>
            </>
          ) : (
            <View style={[s.media, s.mediaEmpty]}>
              <Text style={type.meta}>
                {loading ? 'scanning your library…' : 'nothing in this scope yet.'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {toastMsg && <Toast msg={toastMsg} />}

      <View style={s.progressBlock}>
        <View style={s.progressRow}>
          <Text style={type.meta}>{state.queue.length > 0 ? `${Math.min(state.index + 1, state.queue.length)} of ${state.queue.length}` : '0 of 0'}</Text>
          <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>{formatBytes(stagedSaved)} saved</Text>
        </View>
        <MeterBar progress={state.queue.length > 0 ? Math.min(state.index + 1, 1) / Math.max(state.queue.length, 1) : 0} />
      </View>

      <View style={s.legend}>
        <View style={s.legendPill}><Text style={s.legendPlain}>← previous</Text></View>
        <View style={s.legendPill}><Text style={s.legendPlain}>→ keep</Text></View>
        <View style={[s.legendPill, s.legendPillPrimary]}><Text style={s.legendPrimary}>↑ remove</Text></View>
      </View>

      <View style={s.controls}>
        <View style={{ width: 44 }} />
        <Pressable style={s.iconBtn} accessibilityLabel="undo" onPress={() => dispatch({ type: 'undo' })}>
          <Ionicons name="arrow-undo-outline" size={20} color={colors.text} />
        </Pressable>
        {/* compress the current card in place (pro); free users get the upsell */}
        <Pressable
          style={[s.primaryBtn, compressing && { opacity: 0.6 }]}
          accessibilityLabel="compress"
          disabled={compressing}
          onPress={compressCurrent}>
          <Ionicons name="contract" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  deckArea: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    paddingBottom: 12,
  },
  mediaCard: {
    flex: 1,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    zIndex: 2,
  },
  mediaWrap: { flex: 1 },
  media: { flex: 1 },
  mediaEmpty: { flex: 1, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  cardBehind: {
    position: 'absolute',
    top: 18,
    left: 14,
    right: 14,
    bottom: 0,
    borderRadius: radius.card,
    backgroundColor: colors.cardAlt,
    zIndex: 1,
  },
  stampWrap: { alignSelf: 'center' },
  overlayTop: { position: 'absolute', top: space.lg, left: 0, right: 0, alignItems: 'center', zIndex: 3 },
  overlayBottom: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.md,
    zIndex: 3,
    backgroundColor: 'rgba(20,18,27,0.55)',
    borderRadius: 999,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  stamp: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: colors.onPrimary,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  durationChip: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: { color: '#FFFFFF', fontSize: 10, fontFamily: 'Inter' },
  fileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.md },
  progressBlock: { marginTop: space.lg },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.xs },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.lg, gap: space.sm },
  legendPill: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  legendPillPrimary: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  legendPlain: { ...type.meta, color: colors.text },
  legendPrimary: { ...type.meta, color: colors.primary, fontWeight: '700' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.lg,
    justifyContent: 'space-between',
  },
  iconBtn: {
    height: 44,
    width: 44,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    height: 52,
    width: 52,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
