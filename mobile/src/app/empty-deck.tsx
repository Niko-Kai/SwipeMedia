import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn, HeaderRow, Screen } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';

/** 00b empty deck (user_flow.md §2) */
const SHORTCUTS = [
  { label: 'last 7 days', detail: '312 items · 7.8 GB', href: '/swipe' as const, icon: 'calendar-outline' },
  { label: 'large videos', detail: '38 videos · 12.4 GB', href: '/swipe' as const, icon: 'play-circle-outline' },
  { label: 'screenshots', detail: '1,204 shots · 3.1 GB', href: '/gallery' as const, icon: 'images-outline' },
];

export default function EmptyDeck() {
  const router = useRouter();
  return (
    <Screen scroll>
      <HeaderRow />
      <View style={s.center}>
        <View style={s.checkBadge}>
          <Text style={s.checkGlyph}>✓</Text>
        </View>
        <Text style={type.title}>all caught up for today!</Text>
        <Text style={[type.body, s.body]}>{`nothing left to review in today's set. pick another scope and keep going.`}</Text>
      </View>

      <View style={s.list}>
        {SHORTCUTS.map((row) => (
          <Pressable key={row.label} style={s.row} onPress={() => router.push(row.href)}>
            <View style={s.rowIcon}>
              <Ionicons name={row.icon as never} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { color: colors.text }]}>{row.label}</Text>
              <Text style={type.meta}>{row.detail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>

      <View style={s.footer}>
        <Btn label="clean last 7 days" onPress={() => router.push('/swipe')} />
        <View style={{ height: space.sm }} />
        <Btn label="back to dashboard" tone="ghost" onPress={() => router.push('/dashboard')} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { marginBottom: space.xl, marginTop: space.xl, gap: space.sm },
  checkBadge: {
    height: 56,
    width: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: { fontSize: 26, color: colors.primary },
  body: { color: colors.muted, marginTop: space.xs },
  list: { gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: space.lg,
  },
  rowIcon: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.lg },
});
