import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Card, HeaderRow, Screen } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { trash } from '@/mock/ledger';

/** 02b trash — the 30-day safety net (user_flow.md §2).
 *  Restore is free for everyone; trashed files still occupy storage. */
export default function Trash() {
  const router = useRouter();
  return (
    <Screen scroll>
      <HeaderRow title="trash" titleAlign="left" />
      <View style={s.summary}>
        <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>
          {trash.count} items · {formatBytes(trash.bytes)}
        </Text>
        <Text style={type.meta}>held for 30 days, then deleted for good.</Text>
      </View>

      <Card style={{ gap: 0 }}>
        {trash.rows.map((row, i) => (
          <View key={row.id} style={[s.row, i > 0 && s.rowDivider]}>
            <View style={s.thumb}>
              <Ionicons name="image-outline" size={16} color={colors.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { color: colors.text }]}>{row.name}</Text>
              <Text style={type.meta}>{row.sizeMB} MB</Text>
            </View>
            <View style={s.rowRight}>
              <View style={s.daysChip}>
                <Text style={s.daysLabel}>{row.daysLeft}d left</Text>
              </View>
              <Pressable style={s.restoreBtn} onPress={() => router.push('/dashboard')} accessibilityLabel={`restore ${row.name}`}>
                <Ionicons name="arrow-undo-outline" size={16} color={colors.primary} />
                <Text style={s.restoreLabel}>restore</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </Card>

      <Text style={[type.micro, { marginTop: space.md }]}>{trash.showing}</Text>

      <Text style={[type.body, { color: colors.muted, marginTop: space.lg }]}>
        these files still use android storage until deleted.
      </Text>

      <Text
        style={[type.body, { color: colors.primary, marginTop: space.sm }]}
        onPress={() => {}}>
        {`empty trash to free ${formatBytes(trash.bytes)} now →`}
      </Text>

      <View style={[s.footer, {}]}>
        {/* P3 wires "empty trash now" to createDeleteRequest — today it's a guard stub */}
        <Btn label="empty trash now" tone="danger" onPress={() => {}} />
        <Text style={[type.micro, { textAlign: 'center', marginTop: space.xs }]}>{`this can't be undone.`}</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  summary: { marginBottom: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  daysChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  daysLabel: { fontSize: 11, fontWeight: '600', color: colors.primary, fontFamily: 'Inter' },
  restoreBtn: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  restoreLabel: { fontSize: 11, fontWeight: '600', color: colors.primary, fontFamily: 'Inter' },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.lg },
});
