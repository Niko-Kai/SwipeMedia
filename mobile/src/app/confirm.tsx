import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Btn, Card, HeaderRow, MeterBar, Screen } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { useSession } from '@/features/session/session-context';
import { sessionFreedBytes } from '@/features/session/session';
import { getStorageStats } from '../../modules/mediatools/src';
import { useEffect, useState } from 'react';
import type { StorageStats } from '../../modules/mediatools/src';

/** 04 confirm — the session summary over real staged data (user_flow.md v4 §2).
 *  Nothing changes until Apply — the staged batch commits in P3. */
export default function Confirm() {
  const router = useRouter();
  const { state } = useSession();
  const freedBytes = sessionFreedBytes(state);
  const [storage, setStorage] = useState<StorageStats | null>(null);

  useEffect(() => {
    let active = true;
    getStorageStats()
      .then((s) => active && setStorage(s))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const usedBytes = storage ? storage.totalBytes - storage.freeBytes : null;
  const afterUsed = usedBytes !== null ? Math.max(0, usedBytes - freedBytes) : null;
  const afterFree = storage ? storage.freeBytes + freedBytes : null;

  const empty = state.removed.length === 0 && state.compressed.length === 0;
  const removedBytes = state.removed.reduce((sum, a) => sum + a.sizeBytes, 0);
  const compressedBytes = state.compressed.reduce((sum, c) => sum + (c.item.sizeBytes - c.newSizeBytes), 0);

  return (
    <Screen scroll>
      <HeaderRow />
      <View style={s.center}>
        <View style={s.checkBadge}><Text style={s.checkGlyph}>✓</Text></View>
        <Text style={[type.title, { marginTop: space.md }]}>you freed {formatBytes(freedBytes)}</Text>
        <Text style={[type.body, { color: colors.muted, marginTop: space.xs }]}>apply cleanup to make it real.</Text>
      </View>

      {storage && afterUsed !== null && afterFree !== null && (
        <View style={{ marginTop: space.lg }}>
          <MeterBar progress={afterUsed / storage.totalBytes} />
          <View style={[s.barLabels, { marginTop: space.xs }]}>
            <Text style={type.meta}>{(afterUsed / 1024 ** 3).toFixed(1)} GB used</Text>
            <Text style={type.meta}>{(afterFree / 1024 ** 3).toFixed(1)} GB free</Text>
          </View>
        </View>
      )}

      <Text style={[type.body, { color: colors.muted, marginTop: space.lg }]}>
        {empty ? 'no staged changes yet — swipe the deck or select in the gallery.' : ''}
      </Text>

      <Card style={{ marginTop: space.md, gap: space.lg }}>
        <View>
          <View style={s.destRow}>
            <Text style={type.body}>{state.removed.length} removed</Text>
            <Text style={[type.body, { fontWeight: '700' }]}>{formatBytes(removedBytes)}</Text>
          </View>
          <View style={[s.chip, { marginTop: space.xs }]}><Text style={s.chipLabel}>→ trash</Text></View>
        </View>
        <View style={s.divider} />
        <View>
          <View style={s.destRow}>
            <Text style={type.body}>{state.compressed.length} compressed</Text>
            <Text style={[type.body, { fontWeight: '700' }]}>{formatBytes(compressedBytes)}</Text>
          </View>
          <View style={[s.chip, { marginTop: space.xs }]}><Text style={s.chipLabel}>copies kept, originals in trash</Text></View>
        </View>
      </Card>

      <Text style={[type.body, { color: colors.muted, marginTop: space.lg }]}>
        nothing changes until you apply.
      </Text>
      {/* v4: the trash reservation is stated up front, before the run */}
      <Text style={[type.meta, { marginTop: space.xs }]}>
        trash holds everything for 30 days. {formatBytes(freedBytes)} stays reserved until you empty it.
      </Text>

      <View style={s.footer}>
        <Btn
          label="apply cleanup"
          onPress={() => router.push('/applying')}
          disabled={empty}
        />
        <View style={{ height: space.sm }} />
        <Btn label="discard" tone="ghost" onPress={() => router.dismissTo('/dashboard')} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { marginTop: space.lg, marginBottom: space.lg },
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
