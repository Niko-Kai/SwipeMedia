import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Card, HeaderRow, Screen } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';

/** 00a permission denied (user_flow.md v4 §2) */
const STEPS = ['open settings', 'apps → swipe media', 'permissions → photos & videos'];

export default function PermissionDenied() {
  const router = useRouter();
  return (
    <Screen scroll>
      <HeaderRow back={false} />
      <View style={s.center}>
        <View style={s.lockHalo}>
          <Ionicons name="lock-closed-outline" size={32} color={colors.primary} />
        </View>
        <Text style={[type.title, s.title]}>library access is off</Text>
        <Text style={[type.body, s.body]}>
          swipe media needs access to your photos and videos to scan this device locally. nothing is uploaded.
        </Text>
      </View>

      <Card>
        <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>turn it back on</Text>
        {STEPS.map((step, i) => (
          <View key={step} style={s.stepRow}>
            <View style={s.stepNum}>
              <Text style={s.stepNumLabel}>{i + 1}</Text>
            </View>
            <Text style={[type.body, { color: colors.text }]}>{step}</Text>
          </View>
        ))}
      </Card>

      <Text style={[type.micro, s.footnote]}>you can revoke access anytime. scans stay on this phone.</Text>

      {/* P0 stub: P1 deep-links via Linking.openSettings() */}
      <Btn label="open settings" onPress={() => router.push('/dashboard')} />
      <View style={{ height: space.sm }} />
      <Btn label="try again" tone="ghost" onPress={() => router.push('/dashboard')} />
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'flex-start', marginBottom: space.xl, gap: space.sm },
  lockHalo: {
    height: 64,
    width: 64,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: space.xs },
  body: { color: colors.muted, textAlign: 'left' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepNum: {
    height: 22,
    width: 22,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumLabel: { fontSize: 11, fontWeight: '700', color: colors.onPrimary, fontFamily: 'Inter' },
  footnote: { textAlign: 'left', marginBottom: space.xl },
});
