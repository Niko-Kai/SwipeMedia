import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn, HeaderRow, Screen } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { useDashboardData } from '@/features/media/useDashboardData';

/** 00b empty deck — real scope counts from MediaStore (P1).
 *  Reached when the chosen scope has 0 items (user_flow.md v4 §2). */
export default function EmptyDeck() {
  const router = useRouter();
  const { stats } = useDashboardData();

  const shortcuts = [
    { label: 'last 7 days', detail: `${stats.last7Days.count} items · ${formatBytes(stats.last7Days.bytes)}`, href: '/swipe' as const, icon: 'calendar-outline' as const },
    { label: 'large videos', detail: `${stats.largeVideos.count} videos · ${formatBytes(stats.largeVideos.bytes)}`, href: '/swipe' as const, thumb: 'video' as const, duration: '0:12' },
    { label: 'screenshots', detail: `${stats.screenshots.count} shots · ${formatBytes(stats.screenshots.bytes)}`, href: '/gallery' as const, thumb: 'shot' as const },
  ];

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
        {shortcuts.map((row) => (
          <Pressable key={row.label} style={s.row} onPress={() => router.push(row.href)}>
            {row.icon ? (
              <View style={s.rowIcon}>
                <Ionicons name={row.icon as never} size={18} color={colors.muted} />
              </View>
            ) : row.thumb === 'video' ? (
              <View style={s.rowThumbVideo}>
                <Text style={s.durationChip}>{row.duration}</Text>
              </View>
            ) : row.thumb === 'shot' ? (
              <View style={s.rowThumbShot}>
                <Ionicons name="image-outline" size={14} color={colors.muted} />
              </View>
            ) : null}
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
    height: 84,
    width: 84,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: { fontSize: 38, color: colors.primary },
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
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowThumb: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowThumbShot: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowThumbVideo: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 4,
  },
  durationChip: { fontSize: 8, fontWeight: '600', color: colors.muted, fontFamily: 'Inter' },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.lg },
});
