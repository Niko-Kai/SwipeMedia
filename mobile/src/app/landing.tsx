import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Btn, Pill, Screen } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { requestLibraryPermission } from '@/features/media/library';

/** 00 landing — first-run intro (user_flow.md v4 §2).
 *  v4 hero: a three-card deck caught mid-drag — two cards stacked behind,
 *  the top photo tilted −5° carrying the violet ↑ remove chip.
 *  "allow access" asks for the REAL Photos & Videos permission (P1). */
export default function Landing() {
  const router = useRouter();
  const [asking, setAsking] = useState(false);

  const allowAccess = async () => {
    setAsking(true);
    try {
      const status = await requestLibraryPermission();
      if (status === 'granted') router.replace('/dashboard');
      else router.push('/permission-denied');
    } finally {
      setAsking(false);
    }
  };

  return (
    <Screen>
      <View style={s.hero}>
        <Text style={[type.hero, { letterSpacing: 0.5 }]}>swipe media</Text>
        <Text style={[type.title, s.headline]}>free up your phone</Text>
        <Text style={[type.body, s.subline]}>clean your photos and videos with a swipe. keep what matters.</Text>
      </View>

      <View style={s.deckWrap}>
        <View style={[s.deckCard, s.deckBack2]} />
        <View style={[s.deckCard, s.deckBack1]} />
        <View style={[s.deckCard, s.deckTop]}>
          <View style={s.stampWrap}>
            <Pill label="↑ remove" tone="primary" />
          </View>
        </View>
      </View>

      <View style={s.trustBlock}>
        <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>ready to scan your library</Text>
        <Text style={type.meta}>scans stay on this phone. private, instant, and nothing leaves your device.</Text>
      </View>

      <View style={s.footer}>
        <Btn label={asking ? 'asking…' : 'allow access'} onPress={allowAccess} disabled={asking} />
        <Btn label="not now" tone="ghost" onPress={() => router.push('/permission-denied')} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { gap: space.sm, marginTop: space.xxl },
  headline: { marginTop: space.md },
  subline: { color: colors.muted },
  deckWrap: { height: 300, justifyContent: 'center', alignItems: 'center', marginVertical: space.lg, position: 'relative' },
  deckCard: {
    position: 'absolute',
    borderRadius: radius.frame,
  },
  deckBack2: {
    width: '80%',
    height: 196,
    backgroundColor: colors.cardAlt,
    transform: [{ translateY: -30 }, { rotate: '6deg' }],
  },
  deckBack1: {
    width: '88%',
    height: 204,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    transform: [{ translateY: -16 }, { rotate: '-2deg' }],
  },
  deckTop: {
    width: '94%',
    height: 212,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    transform: [{ rotate: '-5deg' }, { translateY: 8 }],
  },
  stampWrap: { alignSelf: 'flex-end' },
  trustBlock: { gap: space.xs, paddingHorizontal: space.xs },
  footer: { marginTop: 'auto', marginBottom: space.lg, gap: space.sm },
});
