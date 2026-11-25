import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Btn, Card, Pill, Screen } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';

/** 00 landing — first-run intro (user_flow.md §2) */
export default function Landing() {
  const router = useRouter();
  return (
    <Screen>
      <View style={s.hero}>
        <Text style={[type.hero, { letterSpacing: 0.5 }]}>swipe media</Text>
        <Text style={[type.title, s.headline]}>free up your phone</Text>
        <Text style={[type.body, s.subline]}>clean your photos and videos with a swipe. keep what matters.</Text>
      </View>

      <View style={s.stackedCard}>
        <View style={s.cardBack} />
        <View style={s.cardFront}>
          <View style={{ alignSelf: 'flex-end' }}>
            <Pill label="↑ remove" tone="primary" />
          </View>
        </View>
      </View>

      <Card>
        <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>ready to scan your library</Text>
        <Text style={type.meta}>scans stay on this phone. private, instant, and nothing leaves your device.</Text>
      </Card>

      <View style={s.footer}>
        <Btn label="allow access" onPress={() => router.push('/dashboard')} />
        <Btn label="not now" tone="ghost" onPress={() => router.push('/permission-denied')} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { gap: space.sm, marginTop: space.xxl },
  headline: { marginTop: space.md },
  subline: { color: colors.muted },
  stackedCard: { alignItems: 'center', marginVertical: space.xxl, gap: 10 },
  cardBack: {
    position: 'absolute',
    top: 14,
    width: '86%',
    height: 220,
    borderRadius: 40,
    backgroundColor: colors.cardAlt,
  },
  cardFront: {
    width: '92%',
    height: 220,
    borderRadius: 40,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    justifyContent: 'flex-start',
  },
  footer: { marginTop: 'auto', marginBottom: space.lg, gap: space.sm },
});
