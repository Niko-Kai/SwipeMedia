import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, HeaderRow, Screen } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';
import { useEntitlement } from '@/features/billing/entitlement-context';

/** 01c settings — compression + privacy (user_flow.md v4 §2) */
export default function Settings() {
  const router = useRouter();
  const { preset, choosePreset, pro, restore } = useEntitlement();
  const [note, setNote] = useState<string | null>(null);

  const pickMax = () => {
    if (!pro) {
      router.push('/paywall'); // max savings is a pro capability (spec)
      return;
    }
    choosePreset('max');
  };

  const doRestore = async () => {
    const ok = await restore();
    setNote(ok ? 'purchases restored' : 'no purchases found');
  };

  return (
    <Screen scroll>
      <HeaderRow title="settings" titleAlign="left" />

      <Text style={[type.body, { color: colors.muted, marginTop: space.md }]}>compression preset</Text>
      <View style={s.stack}>
        <Pressable style={[s.presetRow, preset === 'balanced' && s.presetSelected]} onPress={() => choosePreset('balanced')}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { color: colors.text }]}>balanced</Text>
            <Text style={type.meta}>1080p · keeps quality</Text>
          </View>
          <View style={preset === 'balanced' ? s.radioSelected : s.radio}>
            {preset === 'balanced' && <View style={s.radioInnerDot} />}
          </View>
        </Pressable>
        <Pressable style={[s.presetRow, preset === 'max' && s.presetSelected]} onPress={pickMax}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { color: colors.text }]}>max savings</Text>
            <Text style={type.meta}>{pro ? '720p · smallest files' : '720p · smallest files · pro'}</Text>
          </View>
          <View style={preset === 'max' ? s.radioSelected : s.radio}>
            {preset === 'max' && <View style={s.radioInnerDot} />}
          </View>
        </Pressable>
      </View>

      <Text style={[type.body, { color: colors.muted, marginTop: space.lg }]}>subscription</Text>
      <Card style={{ marginTop: space.sm, gap: space.md }}>
        <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>swipe media pro</Text>
        <Text style={type.meta}>{pro ? 'pro · unlimited cleanups' : 'free plan · 1 cleanup a day'}</Text>
        <View style={s.splitRow}>
          <Pressable style={s.splitCell} onPress={doRestore}>
            <Text style={[type.body, { color: colors.primary, textAlign: 'center' }]}>restore purchases</Text>
          </Pressable>
          <View style={s.splitDivider} />
          <Pressable style={s.splitCell} onPress={() => router.push('/paywall')}>
            <Text style={[type.body, { color: colors.primary, textAlign: 'center' }]}>manage plan</Text>
          </Pressable>
        </View>
        {note && <Text style={[type.meta, { textAlign: 'center' }]}>{note}</Text>}
      </Card>

      <Text style={[type.body, { color: colors.muted, marginTop: space.lg }]}>privacy</Text>
      <Card style={{ marginTop: space.sm }}>
        <View style={s.privacyRow}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { color: colors.text }]}>privacy statement</Text>
            <Text style={type.meta}>photos never leave this device.</Text>
            <Text style={type.meta}>no account, no upload.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Card>

      <View style={s.footer}>
        <Text style={[type.body, { color: colors.text }]}>swipe media 3.0.0 (build 308)</Text>
        <Text style={[type.meta, {}]}>no account needed. cleanups stay on this phone.</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  stack: { marginTop: space.sm, gap: space.sm },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: space.lg,
    gap: space.md,
  },
  presetSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radio: {
    height: 18,
    width: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.muted,
  },
  radioSelected: {
    height: 18,
    width: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: { height: 8, width: 8, borderRadius: 999, backgroundColor: colors.primary },
  radioCenter: { alignSelf: 'center' },
  splitRow: { flexDirection: 'row', alignItems: 'center' },
  splitCell: { flex: 1, paddingVertical: space.xs },
  splitDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border, alignSelf: 'stretch' },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.lg, gap: 4 },
});
