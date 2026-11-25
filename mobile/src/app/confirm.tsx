import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Btn, Card, HeaderRow, MeterBar, Screen } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { session, storage } from '@/mock/ledger';

/** 04 confirm — the session summary (user_flow.md v4 §2).
 *  Nothing changes until Apply — displayed totals are staged only. */
export default function Confirm() {
  const router = useRouter();
  return (
    <Screen scroll>
      <HeaderRow />
      <View style={s.center}>
        <View style={s.checkBadge}><Text style={s.checkGlyph}>✓</Text></View>
        <Text style={[type.title, s.headline, { marginTop: space.md }]}>you freed {formatBytes(session.freedBytes)}</Text>
        <Text style={[type.body, { color: colors.muted, marginTop: space.xs }]}>apply cleanup to make it real.</Text>
      </View>

      <View style={{ marginTop: space.lg }}>
        {/* v4: bar first, then the used/free labels */}
        <MeterBar progress={session.afterUsedGB / storage.totalGB} />
        <View style={[s.barLabels, { marginTop: space.xs }]}>
          <Text style={type.meta}>{session.afterUsedGB} GB used</Text>
          <Text style={type.meta}>{session.afterFreeGB} GB free</Text>
        </View>
      </View>

      <Card style={{ marginTop: space.lg, gap: space.lg }}>
        <View>
          <View style={s.destRow}>
            <Text style={type.body}>{session.removedCount} removed</Text>
            <Text style={[type.body, { fontWeight: '700' }]}>{formatBytes(session.removedBytes)}</Text>
          </View>
          <View style={[s.chip, { marginTop: space.xs }]}><Text style={s.chipLabel}>→ trash</Text></View>
        </View>
        <View style={s.divider} />
        <View>
          <View style={s.destRow}>
            <Text style={type.body}>{session.compressedCount} compressed</Text>
            <Text style={[type.body, { fontWeight: '700' }]}>{formatBytes(session.compressedBytes)}</Text>
          </View>
          <View style={[s.chip, { marginTop: space.xs }]}><Text style={s.chipLabel}>copies kept, originals in trash</Text></View>
        </View>
      </Card>

      <Text style={[type.body, { color: colors.muted, marginTop: space.lg }]}>
        nothing changes until you apply.
      </Text>
      {/* v4: the trash reservation is stated up front, before the run */}
      <Text style={[type.meta, { marginTop: space.xs }]}>
        trash holds everything for 30 days. {formatBytes(session.freedBytes)} stays reserved until you empty it.
      </Text>

      <View style={[s.footer, {}]}>
        <Btn label="apply cleanup" onPress={() => router.push('/applying')} />
        <View style={{ height: space.sm }} />
        <Btn label="discard" tone="ghost" onPress={() => router.push('/dashboard')} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { marginTop: space.lg, marginBottom: space.lg },
  headline: {},
  checkBadge: {
    height: 48,
    width: 48,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: { fontSize: 24, fontWeight: '700', color: colors.onPrimary },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  destRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  chipLabel: { fontSize: 11, fontWeight: '500', color: colors.muted, fontFamily: 'Inter' },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.lg },
});
