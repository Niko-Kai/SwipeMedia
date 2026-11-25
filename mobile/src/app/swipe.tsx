import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeaderRow, MeterBar, Screen } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { deck } from '@/mock/ledger';

/** 03 swipe — the core loop (user_flow.md v4 §2).
 *  Design order: deck card first, progress below, legend pills, then actions.
 *  Gestures wire in P2; the legend shows only ← ↑ → (no down gesture in the spec). */
export default function Swipe() {
  const router = useRouter();
  return (
    <Screen>
      <HeaderRow
        right={
          <Ionicons name="images-outline" size={22} color={colors.text} accessibilityLabel="open gallery" onPress={() => router.push('/gallery')} />
        }
      />

      {/* media card inset 24 px from the screen edges on a stacked deck (spec).
         The card fills the deck area — media is the hero (v4). */}
      <View style={s.deckArea}>
        <View style={s.mediaCard}>
          {/* stamp pressed onto the media, top-center (v4) */}
          <View style={s.stampWrap}>
            <Text style={s.stamp}>↑ remove</Text>
          </View>
          <View style={s.fileRow}>
            <Text style={[type.body, { color: colors.text }]}>{deck.filename}</Text>
            <Text style={type.meta}>{deck.sizeMB} MB</Text>
          </View>
        </View>
        {/* next card in the stack, peeking behind the current one */}
        <View style={s.cardBehind} pointerEvents="none" />
      </View>

      {/* progress below the card, white tally (design) */}
      <View style={s.progressBlock}>
        <View style={s.progressRow}>
          <Text style={type.meta}>{deck.positionLabel}</Text>
          <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>{formatBytes(deck.savedBytes)} saved</Text>
        </View>
        <MeterBar progress={deck.progress} />
      </View>

      <View style={s.legend}>
        <View style={s.legendPill}><Text style={s.legendPlain}>← previous</Text></View>
        <View style={s.legendPill}><Text style={s.legendPlain}>→ keep</Text></View>
        <View style={[s.legendPill, s.legendPillPrimary]}><Text style={s.legendPrimary}>↑ remove</Text></View>
      </View>
      {/* v4: legend reads "keep", not "next" */}

      <View style={s.controls}>
        <View style={{ width: 44 }} />
        {/* v4: undo centered, compress is the violet primary on the right */}
        <Pressable style={s.iconBtn} accessibilityLabel="undo">
          <Ionicons name="arrow-undo-outline" size={20} color={colors.text} />
        </Pressable>
        {/* P0 stub: compress opens the paywall (spec: over limit -> 05);
            P4 wires real compression here */}
        <Pressable style={s.primaryBtn} accessibilityLabel="compress" onPress={() => router.push('/paywall')}>
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
  },
  mediaCard: {
    flex: 1,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    zIndex: 2,
  },
  cardBehind: {
    position: 'absolute',
    top: 20,
    left: 12,
    right: 12,
    bottom: -14,
    borderRadius: radius.card,
    backgroundColor: colors.cardAlt,
    zIndex: 1,
  },
  stampWrap: { alignSelf: 'center', marginTop: space.md },
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
  fileRow: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
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
  legendPillPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  legendPlain: { ...type.meta, color: colors.text },
  legendPrimary: { ...type.meta, color: colors.onPrimary, fontWeight: '700' },
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
