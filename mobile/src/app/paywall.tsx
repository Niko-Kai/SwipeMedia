import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Screen } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';
import { paywall } from '@/mock/ledger';

/** 06 paywall — modal over the caller (user_flow.md §2).
 *  30-day trash + restore is free for everyone; Pro sells volume + compression. */
export default function Paywall() {
  const router = useRouter();
  return (
    <Screen>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="close">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <View style={s.proBadge}>
          <Text style={s.proLabel}>PRO</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[type.title, { fontSize: 28, marginTop: space.xl }]}>clean without limits</Text>
      <Text style={[type.body, { color: colors.muted, marginTop: space.xs }]}>
        unlimited cleanups and max-savings compression, without daily caps.
      </Text>

      <View style={{ marginTop: space.xl, gap: space.md }}>
        {paywall.benefits.map((benefit) => (
          <View key={benefit} style={s.benefitRow}>
            <Ionicons name="checkmark" size={16} color={colors.primary} />
            <Text style={[type.body, { color: colors.text }]}>{benefit}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: space.xl, gap: space.sm }}>
        {paywall.plans.map((plan) => (
          <View key={plan.id} style={plan.selected ? s.planSelected : s.plan}>
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { fontWeight: '600', color: plan.selected ? colors.primary : colors.text }]}>
                {plan.label}
              </Text>
              <Text style={type.meta}>{plan.price}</Text>
              {plan.sub ? <Text style={type.meta}>{plan.sub}</Text> : null}
            </View>
            {plan.id === 'annual' && (
              <View style={s.saveChip}>
                <Text style={s.saveChipLabel}>save 85%</Text>
              </View>
            )}
            <View style={plan.selected ? s.radioOuterSelected : s.radioOuter}>
              {plan.selected && <View style={s.radioInnerDot} />}
            </View>
          </View>
        ))}
      </View>

      <View style={s.footer}>
        <Btn label="continue" onPress={() => router.back()} />
        <Text style={[type.meta, { textAlign: 'center' }]}>google play billing · cancel anytime</Text>
        <Text style={[type.body, { color: colors.primary, textAlign: 'center' }]} onPress={() => {}}>
          restore purchases
        </Text>
        <Text style={[type.micro, { textAlign: 'center' }]}>terms · privacy · refunds</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proBadge: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
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
  footer: { marginTop: 'auto', marginBottom: space.lg, gap: space.sm, paddingTop: space.xl },
});
