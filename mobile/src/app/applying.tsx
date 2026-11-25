import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, HeaderRow, MeterBar, Screen } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';
import { MB, applying } from '@/mock/ledger';

/** 04a applying — foreground progress (user_flow.md v4 §2).
 *  No close X — cancel cleanup is the only exit. P3 renders the removal-only path;
 *  P4 adds the real compression jobs. */
export default function Applying() {
  const router = useRouter();
  return (
    <Screen scroll>
      {/* v4: no close X — cancel cleanup at the bottom is the only exit */}
      <HeaderRow
        back={false}
        titleAlign="left"
        title="applying cleanup"
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
        <Text style={[type.meta, { marginTop: space.xs }]}>{Math.round(applying.freedSoFarBytes / MB)} MB freed so far</Text>
      </View>

      <Text style={[type.body, { color: colors.muted, marginTop: space.lg }]}>
        {applying.current.name === 'IMG_2510.MOV' ? 'compressing video 3 of 12' : ''}
      </Text>

      <Card style={{ marginTop: space.sm }}>
        <View style={s.jobHead}>
          <View style={s.jobThumb}>
            <Ionicons name="play" size={14} color={colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.meta}>now compressing</Text>
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
        {applying.upNext.map((item, i) => (
          <View key={i} style={s.upNextRow}>
            <Text style={type.meta}>{item.name ?? '+ 8 more'}</Text>
            {item.size && <Text style={type.meta}>{item.size}</Text>}
          </View>
        ))}
        <View style={s.estimateRow}>
          <Text style={type.meta}>about 1:40 left</Text>
          <Text style={type.meta}>{applying.total}</Text>
        </View>
      </Card>

      <View style={s.noteCard}>
        <View style={s.noteSwatch}>
          <Ionicons name="flash" size={14} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.body, { color: colors.text }]}>keeps running in the background</Text>
          <Text style={[type.meta, {}]}>
            {`android won't stop the job if you switch apps. one 'allow' at the end trashes all 36 items.`}
          </Text>
        </View>
      </View>

      <View style={s.footer}>
        {/* the only exit (v4) */}
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={[type.body, { color: colors.text, textAlign: 'center' }]}>cancel cleanup</Text>
        </Pressable>
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
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  upNextRow: { flexDirection: 'row', justifyContent: 'space-between' },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    padding: space.lg,
    marginTop: space.lg,
  },
  noteSwatch: {
    height: 32,
    width: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 92, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.xl },
});
