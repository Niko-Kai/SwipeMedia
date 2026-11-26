import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Btn, Card, HeaderRow, Screen } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';
import { requestLibraryPermission } from '@/features/media/library';

/** 00a permission denied (user_flow.md v4 §2) */
const STEPS = ['open settings', 'apps → swipe media', 'permissions → photos & videos'];

export default function PermissionDenied() {
  const router = useRouter();
  const [asking, setAsking] = useState(false);

  const openSettings = async () => {
    await Linking.openSettings();
  };

  const tryAgain = async () => {
    setAsking(true);
    try {
      const status = await requestLibraryPermission();
      if (status === 'granted') router.replace('/dashboard');
    } finally {
      setAsking(false);
    }
  };

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

      <Btn label="open settings" onPress={openSettings} />
      <View style={{ height: space.sm }} />
      <Btn label={asking ? 'asking…' : 'try again'} tone="ghost" onPress={tryAgain} disabled={asking} />
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
