import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Pill, Screen } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { highYieldScopes, dateScopes as mockScopes, savedSoFarGB, storage } from '@/mock/ledger';

const SCOPE_ICONS: Record<string, string> = {
  videos: 'play-circle-outline',
  screenshots: 'images-outline',
};

/** 02 dashboard — storage and scope (user_flow.md §2) */
export default function Dashboard() {
  const router = useRouter();
  return (
    <Screen scroll>
      {/* header: wordmark left · trash count, trash, gear, PRO right (spec) */}
      <View style={s.header}>
        <Text style={s.wordmark}>swipe media</Text>
        <View style={s.headerRight}>
          <Pressable onPress={() => router.push('/trash')} hitSlop={8}>
            <Text style={type.meta}>trash (36)</Text>
          </Pressable>
          <Ionicons name="trash-outline" size={22} color={colors.text} accessibilityLabel="open trash" onPress={() => router.push('/trash')} />
          <Ionicons name="settings-outline" size={22} color={colors.text} accessibilityLabel="open settings" onPress={() => router.push('/settings')} />
          <Pressable onPress={() => router.push('/paywall')} hitSlop={8} accessibilityLabel="pro">
            <Pill label="PRO" tone="primary" />
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
            <Ionicons name={(SCOPE_ICONS[scope.id] ?? 'help-circle-outline') as never} size={28} color={colors.primary} />
            <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>{scope.label}</Text>
            <Text style={[type.meta, { color: colors.primary }]}>{scope.detail} · {formatBytes(scope.bytes)}</Text>
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
                <Text style={type.meta}>
                  {scope.detail}{scope.bytes !== undefined ? ` — ${formatBytes(scope.bytes)}` : ' — choose'}
                </Text>
              </View>
              {scope.id === 'range' ? (
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              ) : (
                <View style={selected ? s.radioSelected : s.radio} />
              )}
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
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
  list: { marginTop: space.md, gap: space.sm },
  scopeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  scopeSelected: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { height: 16, width: 16, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border },
  radioSelected: { height: 16, width: 16, borderRadius: 999, backgroundColor: colors.primary },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.lg },
});
