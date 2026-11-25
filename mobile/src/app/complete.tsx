import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Btn, HeaderRow, MeterBar, Screen } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { session } from '@/mock/ledger';

/** 04b complete — reward and share (user_flow.md v4 §2).
 *  Share card is drawn to cacheDir via FileProvider in P3; never to the camera roll. */
export default function Complete() {
  const router = useRouter();
  return (
    <Screen scroll>
      <HeaderRow back={false} />
      <View style={s.center}>
        <View style={s.checkBadge}><Text style={s.checkGlyph}>✓</Text></View>
        <Text style={[type.title, { marginTop: space.md }]}>1.8 GB freed!</Text>
        <Text style={[type.body, { color: colors.muted }]}>{session.savedTotalGB} GB saved so far.</Text>
      </View>

      <View style={s.shareCard}>
        <View style={s.shareHead}>
          <Text style={s.brand}>swipe media</Text>
        </View>
        <Text style={s.date}>jun 23, 2026</Text>
        <Text style={s.bigNumber}>{formatBytes(session.freedBytes)}</Text>
        <Text style={s.bigCaption}>freed on my phone today</Text>
        <View style={{ marginTop: space.md }}>
          <MeterBar progress={session.afterUsedGB / 64} height={8} trackColor="rgba(255,255,255,0.25)" fillColor="#FFFFFF" />
          <View style={s.meterLabels}>
            <Text style={s.cardMeta}>58.2 GB used</Text>
            <Text style={s.cardMeta}>56.4 GB used</Text>
          </View>
        </View>
        <View style={s.cardFooterRow}>
          <Text style={s.cardMeta}>no cloud. no upload.</Text>
          <Text style={s.cardMeta}>30-day undo</Text>
        </View>
      </View>

      <Text style={[type.body, { color: colors.text, textAlign: 'center', marginTop: space.lg }]}>
        {formatBytes(session.freedBytes)} is reserved in 30-day trash.
      </Text>
      <Text
        style={[type.body, { color: colors.muted, textAlign: 'center', marginTop: space.xs }]}
        onPress={() => router.push('/trash')}>
        empty trash to free space now →
      </Text>

      <View style={[s.footer, {}]}>
        <Btn label="share result" onPress={() => {}} />
        <View style={{ height: space.sm }} />
        <Btn label="done" tone="ghost" onPress={() => router.dismissTo('/dashboard')} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'flex-start', marginTop: space.md, marginBottom: space.lg, gap: space.xs },
  checkBadge: {
    height: 48,
    width: 48,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: { fontSize: 24, fontWeight: '700', color: colors.onPrimary },
  shareCard: {
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    padding: space.xl,
  },
  shareHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontFamily: 'Inter', fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  date: { fontFamily: 'Inter', fontSize: 12, fontWeight: '500', color: colors.onPrimary, marginTop: 2 },
  bigNumber: { fontFamily: 'Inter', fontSize: 44, fontWeight: '700', color: colors.onPrimary, marginTop: space.md },
  bigCaption: { fontFamily: 'Inter', fontSize: 15, fontWeight: '500', color: colors.onPrimary },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  cardMeta: { fontFamily: 'Inter', fontSize: 12, fontWeight: '500', color: colors.onPrimary },
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xxl },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.lg },
});
