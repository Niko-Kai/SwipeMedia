import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Card, HeaderRow, MeterBar, Screen } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { applying } from '@/mock/ledger';

/** 05a applying — foreground progress (user_flow.md §2).
 *  P3 renders the removal-only path; P4 adds the real compression jobs. */
export default function Applying() {
  const router = useRouter();
  return (
    <Screen scroll>
      <HeaderRow
        back={false}
        titleAlign="left"
        title="applying cleanup"
        right={<Text style={[type.body, { color: colors.muted }]} onPress={() => router.back()}>✕</Text>}
      />

      <View style={s.headRow}>
        <View style={s.statusPill}>
          <View style={s.statusDot} />
          <Text style={s.statusLabel}>in progress</Text>
        </View>
      </View>
      <Text style={[type.hero, { fontSize: 40, marginTop: space.lg }]}>{applying.overallLabel}</Text>
      <Text style={type.meta}>{applying.ofLabel}</Text>
      <View style={{ marginTop: space.md }}>
        <MeterBar progress={applying.overall} height={12} />
        <Text style={[type.meta, { marginTop: space.xs }]}>
          {applying.current.indexLabel.split(' · ')[0].replace('video', 'of')} · {formatBytes(applying.freedSoFarBytes)} freed so far
        </Text>
      </View>

      <Text style={[type.body, { color: colors.muted, marginTop: space.lg }]}>
        {applying.current.name === 'IMG_2510.MOV' ? 'compressing video 3 of 12' : ''}
      </Text>

      <Card style={{ marginTop: space.sm }}>
        <View style={s.jobHead}>
          <View style={s.jobThumb}>
            <Ionicons name="play" size={14} color={colors.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { color: colors.text }]}>{applying.current.name}</Text>
            <Text style={type.meta}>
              {applying.current.fromMB} MB → {applying.current.toMB} MB
            </Text>
          </View>
        </View>
        <View style={{ marginTop: space.md }}>
          <MeterBar progress={applying.current.progress} />
          <Text style={[type.meta, { marginTop: space.xs }]}>{applying.current.indexLabel}</Text>
        </View>

        <View style={[s.divider, { marginVertical: space.lg }]} />

        <Text style={[type.body, { color: colors.muted }]}>up next</Text>
        {applying.upNext.map((item) => (
          <Text key={item} style={type.meta}>{item}</Text>
        ))}
        <View style={s.estimateRow}>
          <Text style={type.meta}>{applying.estimate}</Text>
          <Text style={type.meta}>{applying.total}</Text>
        </View>
      </Card>

      <View style={s.noteCard}>
        <Ionicons name="flash" size={16} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[type.body, { color: colors.text }]}>keeps running in the background</Text>
          <Text style={[type.meta, {}]}>
            {`android won't stop the job if you switch apps. one 'allow' at the end trashes all 36 items.`}
          </Text>
        </View>
      </View>

      <View style={s.footer}>
        <Btn label="cancel cleanup" tone="ghost" onPress={() => router.back()} />
        {/* P3 removes this: finishing follows from the job, not a button */}
        <Text
          style={[type.meta, { textAlign: 'center', textDecorationLine: 'underline', marginTop: space.md }]}
          onPress={() => router.replace('/complete')}>
          finish →
        </Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.md },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusDot: { height: 6, width: 6, borderRadius: 999, backgroundColor: colors.primary },
  statusLabel: { fontSize: 11, fontWeight: '600', color: colors.primary, fontFamily: 'Inter' },
  jobHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  jobThumb: {
    height: 36,
    width: 36,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    padding: space.lg,
    marginTop: space.lg,
  },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.xl },
});
