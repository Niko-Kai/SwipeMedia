import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { paywall } from '@/mock/ledger';
import { useEntitlement } from '@/features/billing/entitlement-context';

/** 05 paywall — sheet over a dimmed caller (user_flow.md v4 §2).
 *  On a Play-enabled device "continue" launches Google Play Billing; the
 *  entitlement contract is identical, so the emulator exercises it directly.
 *  30-day trash + restore is free for everyone; pro sells volume + compression. */
export default function Paywall() {
  const router = useRouter();
  const { purchase, restore, pro } = useEntitlement();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [selected, setSelected] = useState('annual');

  const buy = async () => {
    setBusy(true);
    try {
      await purchase();
      router.back(); // spec: close/purchase returns to the caller
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    setBusy(true);
    try {
      const ok = await restore();
      setNote(ok ? 'purchases restored' : 'no purchases found on this account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.backdrop}>
      <Pressable style={s.backdropTouch} onPress={() => router.back()} />
      <View style={s.sheet}>
        <View style={s.grabberWrap}>
          <View style={s.grabber} />
        </View>

        {/* v4: close X on its own row, top-right of the sheet */}
        <View style={s.closeRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="close">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.sheetScroll}>
          <View style={s.headerRow}>
            <View style={s.proBadge}>
              <Text style={s.proLabel}>pro</Text>
            </View>
            <Text style={[type.body, { fontWeight: '600', color: colors.text, flex: 1 }]}>clean without limits</Text>
          </View>
          <Text style={[type.meta, { marginTop: space.xs }]}>
            {pro ? 'pro is active on this device.' : 'unlimited cleanups and max-savings compression.'}
          </Text>

          <View style={{ marginTop: space.lg, gap: space.sm }}>
            {paywall.benefits.map((benefit) => (
              <View key={benefit} style={s.benefitRow}>
                <Ionicons name="checkmark" size={16} color={colors.primary} />
                <Text style={[type.body, { color: colors.text }]}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: space.lg, gap: space.sm }}>
            {paywall.plans.map((plan) => {
              const isSel = selected === plan.id;
              return (
                <Pressable key={plan.id} onPress={() => setSelected(plan.id)} style={isSel ? s.planSelected : s.plan}>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>{plan.label}</Text>
                    <Text style={type.meta}>{plan.price}</Text>
                    {plan.sub ? <Text style={type.meta}>{plan.sub}</Text> : null}
                  </View>
                  {plan.id === 'annual' && (
                    <View style={s.saveChip}>
                      <Text style={s.saveChipLabel}>save 85%</Text>
                    </View>
                  )}
                  <View style={isSel ? s.radioOuterSelected : s.radioOuter}>
                    {isSel && <View style={s.radioInnerDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: space.lg }}>
            <Btn label={busy ? 'working…' : pro ? 'pro active' : 'continue'} onPress={buy} disabled={busy || pro} />
          </View>
          <Text style={[type.meta, { textAlign: 'center', marginTop: space.md }]}>google play billing · cancel anytime</Text>
          <Pressable onPress={doRestore} hitSlop={8}>
            <Text style={[type.body, { color: colors.text, textAlign: 'center', marginTop: space.xs }]}>
              restore purchases
            </Text>
          </Pressable>
          {note && <Text style={[type.meta, { textAlign: 'center', marginTop: space.xs }]}>{note}</Text>}
          <Text style={[type.micro, { textAlign: 'center', marginTop: space.xs, marginBottom: space.lg }]}>terms · privacy · refunds</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20, 18, 27, 0.72)', justifyContent: 'flex-end' },
  backdropTouch: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.frame,
    borderTopRightRadius: radius.frame,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    maxHeight: '94%',
  },
  grabberWrap: { alignItems: 'center', paddingVertical: space.xs },
  grabber: { width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border },
  closeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: space.xs },
  sheetScroll: { paddingBottom: space.xl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.xs,
  },
  proBadge: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  proLabel: { fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: colors.text, letterSpacing: 1.5 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  plan: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.lg,
    gap: space.md,
  },
  planSelected: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.lg,
    gap: space.md,
  },
  saveChip: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  saveChipLabel: { fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: colors.onPrimary },
  radioOuter: { height: 18, width: 18, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border },
  radioOuterSelected: {
    height: 18,
    width: 18,
    borderRadius: 999,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: { height: 6, width: 6, borderRadius: 999, backgroundColor: colors.onPrimary },
});
