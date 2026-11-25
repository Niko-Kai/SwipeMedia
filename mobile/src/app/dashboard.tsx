import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Pill, Screen } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { highYieldScopes, dateScopes as mockScopes, savedSoFarGB, storage } from '@/mock/ledger';

/** 01 dashboard — storage and scope (user_flow.md v4 §2) */

/** 01 dashboard — storage and scope (user_flow.md v4 §2) */
export default function Dashboard() {
  const router = useRouter();
  return (
    <Screen scroll>
      {/* header: wordmark left · trash count, trash, gear, pro right (spec) */}
      <View style={s.header}>
        <Text style={s.wordmark}>swipe media</Text>
        <View style={s.headerRight}>
          <Pressable onPress={() => router.push('/paywall')} hitSlop={8} accessibilityLabel="pro">
            <Pill label="pro" tone="primary" />
          </Pressable>
          <Ionicons name="settings-outline" size={22} color={colors.text} accessibilityLabel="open settings" onPress={() => router.push('/settings')} />
          <Pressable onPress={() => router.push('/trash')} hitSlop={8} accessibilityLabel="open trash">
            <View style={s.trashBadgeWrap}>
              <Ionicons name="trash-outline" size={22} color={colors.text} />
              <View style={s.trashBadge}>
                <Text style={s.trashBadgeLabel}>36</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={s.figure}>
        <Text style={[type.hero, { fontSize: 44 }]}>{savedSoFarGB} GB</Text>
        <Text style={type.meta}>saved so far</Text>
        <View style={{ marginTop: space.md }}>
          {/* 58.2 of 64 GB = 91% full (ledger) */}
          <View style={s.meter}>
            <View style={[s.meterFill, { flex: storage.usedGB }]} />
            <View style={{ flex: storage.freeGB }} />
          </View>
          <View style={[s.meterLabels, { marginTop: space.xs }]}>
            <Text style={type.meta}>{storage.usedGB} GB used</Text>
            <Text style={type.meta}>{storage.freeGB} GB free</Text>
          </View>
        </View>
      </View>

      <Text style={[type.title, { fontSize: 20 }]}>clean what first?</Text>
      <View style={s.cardsRow}>
        {highYieldScopes.map((scope) => (
          <Pressable
            key={scope.id}
            style={[s.cardBase, { flex: 1 }]}
            onPress={() => router.push(scope.id === 'screenshots' ? '/gallery' : '/swipe')}
          >
            {scope.id === 'videos' ? (
              /* v4: real video thumbnail 36×27 (mock block until P1 real media) */
              <View style={s.videoThumb}>
                <Ionicons name="play" size={10} color={colors.onPrimary} />
              </View>
            ) : (
              /* v4: 2×2 mini-grid of screenshots, 16×12 each (mock until P1) */
              <View style={s.miniGrid}>
                {[0, 1, 2, 3].map((n) => (
                  <View key={n} style={s.miniGridCell} />
                ))}
              </View>
            )}
            <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>{scope.label}</Text>
            <Text style={type.meta}>{scope.detail} · {formatBytes(scope.bytes)}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[type.body, { color: colors.muted, marginTop: space.md }]}>or by date</Text>
      <View style={s.list}>
        {mockScopes.map((scope) => {
          const selected = scope.selected === true;
          return (
            <Pressable
              key={scope.id}
              style={[s.cardBase, s.scopeRow, selected && s.scopeSelected]}
              onPress={() => {
                if (scope.id === 'range') router.push('/pick-range');
                else router.push('/swipe');
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.body, { color: selected ? colors.text : colors.muted }]}>{scope.label}</Text>
                <Text style={type.meta}>{scope.detail}</Text>
              </View>
              {scope.bytes !== undefined ? (
                <Text style={[type.body, { fontWeight: '700', color: selected ? colors.primary : colors.text }]}>
                  {formatBytes(scope.bytes)}
                </Text>
              ) : (
                <Text style={type.meta}>choose</Text>
              )}
              <View style={selected ? s.radioSelected : s.radio} />
            </Pressable>
          );
        })}
      </View>

      <View style={[s.footer, {}]}>
        <Btn label="start cleaning" onPress={() => router.push('/swipe')} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { ...type.body, fontWeight: '700', fontSize: 18 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  trashBadgeWrap: { position: 'relative' },
  trashBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  trashBadgeLabel: { fontSize: 9, fontWeight: '700', color: colors.onPrimary, fontFamily: 'Inter' },
  figure: { gap: space.xs, marginTop: space.lg, marginBottom: space.lg },
  meter: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.cardAlt,
    overflow: 'hidden',
  },
  meterFill: { backgroundColor: colors.primary },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  cardsRow: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  cardBase: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  videoThumb: {
    height: 27,
    width: 36,
    borderRadius: 8,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
  miniGridCell: {
    height: 12,
    width: 16,
    borderRadius: 3,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: { marginTop: space.md, gap: space.sm },
  scopeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  scopeSelected: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { height: 16, width: 16, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border },
  radioSelected: { height: 16, width: 16, borderRadius: 999, backgroundColor: colors.primary },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.lg },
});
