import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { calendar } from '@/mock/ledger';

/** 02a pick a range — month calendar sheet (user_flow.md §2).
 *  June 2026 starts Monday; range 15–18: endpoints solid violet, interior tinted,
 *  today 23 outlined, trailing July days dimmed. P1 swaps the mock for real month math. */
const [startDay, endDay] = calendar.selectedRange;

export default function PickRange() {
  const router = useRouter();
  // 30 days + 5 trailing dimmed July cells = 6×7 grid (spec)
  const cells = [...Array.from({ length: calendar.daysInMonth }, (_, i) => i + 1), 1, 2, 3, 4, 5];

  return (
    <View style={s.backdrop}>
      <Pressable style={s.backdropTouch} onPress={() => router.back()} />
      <View style={s.sheet}>
        <View style={s.grabberWrap}>
          <View style={s.grabber} />
        </View>

        <View style={s.headerRow}>
          <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>pick a date range</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={[type.body, { color: colors.muted }]}>cancel</Text>
          </Pressable>
        </View>
        <Text style={[type.meta, { marginTop: space.xs }]}>{calendar.hint}</Text>

        <View style={s.monthNav}>
          <Ionicons name="chevron-back" size={18} color={colors.muted} />
          <Text style={[type.body, { color: colors.text }]}>{calendar.monthLabel.trim().replace('‹', '').replace('›', '').trim()}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>

        <View style={s.weekRow}>
          {calendar.weekdays.map((d, i) => (
            <Text key={i} style={s.weekday}>{d}</Text>
          ))}
        </View>

        <View style={s.grid}>
          {cells.map((day, i) => (
            <View key={i} style={[s.cell, cellStyle(day)]}>
              <Text style={cellLabel(day)}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={[s.footer, {}]}>
          <Btn label="apply range" onPress={() => router.replace('/swipe')} />
        </View>
      </View>
    </View>
  );
}

function cellStyle(day: number) {
  if (day > calendar.daysInMonth) return s.dayDim;
  if (day === calendar.today) return s.dayToday;
  if (day === startDay || day === endDay) return s.dayEndpoint;
  if (day > startDay && day < endDay) return s.dayInRange;
  return s.dayPlain;
}

function cellLabel(day: number) {
  if (day > calendar.daysInMonth) return s.dayDimLabel;
  if (day === startDay || day === endDay) return s.dayEndpointLabel;
  if (day > startDay && day < endDay) return s.dayInRangeLabel;
  if (day === calendar.today) return s.dayTodayLabel;
  return s.dayPlainLabel;
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20, 18, 27, 0.72)', justifyContent: 'flex-end' },
  backdropTouch: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.frame,
    borderTopRightRadius: radius.frame,
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
  },
  grabberWrap: { alignItems: 'center', paddingVertical: space.sm },
  grabber: { width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: space.lg,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.md },
  weekday: { ...type.meta, width: 46, textAlign: 'center', color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cell: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  dayPlain: { backgroundColor: 'transparent' },
  dayPlainLabel: { ...type.body, fontSize: 14, color: colors.text },
  dayEndpoint: { backgroundColor: colors.primary },
  dayEndpointLabel: { ...type.body, fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  dayInRange: { backgroundColor: colors.primarySoft },
  dayInRangeLabel: { ...type.body, fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  dayDim: { backgroundColor: 'transparent', opacity: 0.25 },
  dayDimLabel: { ...type.body, fontSize: 14, color: colors.muted },
  dayToday: { borderWidth: 1.5, borderColor: colors.primary },
  dayTodayLabel: { ...type.body, fontSize: 14, fontWeight: '700', color: colors.primary },
  footer: { marginTop: space.lg },
});
