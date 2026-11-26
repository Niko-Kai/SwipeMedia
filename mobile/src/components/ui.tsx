import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, space, type } from '@/theme/tokens';

type ScreenProps = { children: ReactNode; scroll?: boolean; style?: ViewStyle };

export function Screen({ children, scroll = false, style }: ScreenProps) {
  const body = (
    <View style={[s.body, style]} collapsable={false}>
      {children}
    </View>
  );
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {scroll ? <ScrollView contentContainerStyle={s.scrollContent}>{body}</ScrollView> : body}
    </SafeAreaView>
  );
}

export function HeaderRow({
  title,
  back = true,
  right,
  titleAlign = 'center',
}: {
  title?: string;
  back?: boolean;
  right?: ReactNode;
  titleAlign?: 'left' | 'center';
}) {
  const router = useRouter();
  if (titleAlign === 'left') {
    return (
      <View style={s.headerRow}>
        {back && (
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.text}
            accessibilityLabel="back"
            onPress={() => router.back()}
          />
        )}
        {title ? <Text style={[type.body, { fontWeight: '600' }]}>{title}</Text> : <View />}
        <View style={{ flex: 1 }} />
        <View style={s.headerSideRight}>{right}</View>
      </View>
    );
  }
  return (
    <View style={s.headerRow}>
      <View style={s.headerSide}>
        {back && (
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.text}
            accessibilityLabel="back"
            onPress={() => router.back()}
          />
        )}
      </View>
      {title ? <Text style={[type.body, s.headerTitle]}>{title}</Text> : <View />}
      <View style={s.headerSideRight}>{right}</View>
    </View>
  );
}

type BtnProps = {
  label: string;
  onPress?: () => void;
  tone?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
};

export function Btn({ label, onPress, tone = 'primary', disabled }: BtnProps) {
  const styles =
    tone === 'primary' ? s.btnPrimary : tone === 'danger' ? s.btnDanger : s.btnGhost;
  const labelStyle = tone === 'primary' ? s.btnPrimaryLabel : tone === 'danger' ? s.btnDangerLabel : s.btnGhostLabel;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [s.btn, styles, pressed && s.btnPressed]}>
      <Text style={[type.body, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'primary' | 'neutral' }) {
  return (
    <View style={tone === 'primary' ? s.pillPrimary : s.pillNeutral}>
      <Text style={tone === 'primary' ? s.pillPrimaryLabel : s.pillNeutralLabel}>{label}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function MeterBar({
  progress,
  height = 10,
  trackColor,
  fillColor,
}: {
  progress: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
}) {
  return (
    <View style={[s.meter, { height }, trackColor ? { backgroundColor: trackColor } : null]}>
      <View style={[s.meterFill, { flex: Math.max(progress, 0.001) }, fillColor ? { backgroundColor: fillColor } : null]} />
      <View style={{ flex: 1 - Math.min(progress, 1) }} />
    </View>
  );
}

export function IconBtn({ name, onPress, size = 44 }: { name: keyof typeof Ionicons.glyphMap | string; onPress?: () => void; size?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.iconBtn, pressed && s.btnPressed]}>
      <Ionicons name={name as never} size={size * 0.5} color={colors.text} />
    </Pressable>
  );
}
export function Toast({ msg }: { msg: string }) {
  return (
    <View style={s.toastWrap} pointerEvents="none">
      <View style={s.toast}>
        <Text style={s.toastLabel}>{msg}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  body: { flex: 1, paddingHorizontal: space.xl },
  scrollContent: { flexGrow: 1 },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: { width: 60, flexDirection: 'row' },
  headerSideRight: { width: 60, flexDirection: 'row', justifyContent: 'flex-end', gap: space.lg },
  headerTitle: { color: colors.text },
  btn: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnDanger: { backgroundColor: 'rgba(255, 107, 107, 0.10)', borderWidth: 1.5, borderColor: colors.danger },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
  btnPressed: { opacity: 0.8 },
  btnPrimaryLabel: { color: colors.onPrimary, fontWeight: '600' },
  btnDangerLabel: { color: colors.danger, fontWeight: '600' },
  btnGhostLabel: { color: colors.text, fontWeight: '600' },
  pillPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pillNeutral: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pillPrimaryLabel: { fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: colors.onPrimary, letterSpacing: 0.5 },
  pillNeutralLabel: { fontFamily: 'Inter', fontSize: 11, fontWeight: '600', color: colors.primary, letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  meter: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  meterFill: { backgroundColor: colors.primary },
  iconBtn: {
    height: 44,
    width: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastWrap: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: 120,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: space.lg,
  },
  toastLabel: { ...type.meta, color: colors.text },
});
