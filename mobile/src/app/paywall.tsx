import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { paywall } from '@/mock/ledger';

/** 05 paywall — sheet over a dimmed caller (user_flow.md v4 §2).
 *  Drawn as what it is: the caller stays behind a scrim, offers in a rounded
 *  bottom sheet (same grammar as the 01a calendar sheet). 30-day trash + restore
 *  is free for everyone; pro sells volume + compression. */
export default function Paywall() {
  const router = useRouter();
  return (
    <View style={s.backdrop}>
      <Pressable style={s.backdropTouch} onPress={() => router.back()} />
      <View style={s.sheet}>
        <View style={s.grabberWrap}>
          <View style={s.grabber} />
        </View>
        <ScrollView contentContainerStyle={s.sheetScroll}>

        {/* v4: close X on its own row, top-right of the sheet */}
        <View style={s.closeRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="close">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={s.headerRow}>
          <View style={s.proBadge}>
            <Text style={s.proLabel}>pro</Text>
          </View>
          <Text style={[type.body, { fontWeight: '600', color: colors.text, flex: 1 }]}>clean without limits</Text>
        </View>
        <Text style={[type.meta, { marginTop: space.xs }]}>unlimited cleanups and max-savings compression.</Text>

        <View style={{ marginTop: space.lg, gap: space.sm }}>
          {paywall.benefits.map((benefit) => (
            <View key={benefit} style={s.benefitRow}>
              <Ionicons name="checkmark" size={16} color={colors.primary} />
              <Text style={[type.body, { color: colors.text }]}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: space.lg, gap: space.sm }}>
          {paywall.plans.map((plan) => (
            <View key={plan.id} style={plan.selected ? s.planSelected : s.plan}>
              <View style={{ flex: 1 }}>
                <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>
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

        <Btn label="continue" onPress={() => router.back()} />
        <Text style={[type.meta, { textAlign: 'center', marginTop: space.md }]}>google play billing · cancel anytime</Text>
        <Text style={[type.body, { color: colors.text, textAlign: 'center', marginTop: space.xs }]} onPress={() => {}}>
          restore purchases
        </Text>
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
  sheetScroll: { paddingBottom: space.xl },
  closeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: space.xs },
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
