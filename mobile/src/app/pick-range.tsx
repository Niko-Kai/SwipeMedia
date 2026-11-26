import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { monthGrid, isSameLocalDay, startOfDayLocal } from '@/lib/dates';

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/** 01a pick a range — real month calendar sheet (user_flow.md v4 §2).
 *  Monday-first grid, tap-to-select start then end, dimmed surrounding days. */
export default function PickRange() {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [todayMs] = useState(() => startOfDayLocal(Date.now()));
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);

  const grid = monthGrid(cursor.year, cursor.month);

  const tapDay = (day: number) => {
    const ms = startOfDayLocal(new Date(cursor.year, cursor.month, day).getTime());
    if (rangeStart === null || (rangeStart !== null && rangeEnd !== null)) {
      setRangeStart(ms);
      setRangeEnd(null);
    } else if (ms < rangeStart) {
      setRangeStart(ms);
    } else {
      setRangeEnd(ms);
    }
  };

  const dayMs = (day: number) => startOfDayLocal(new Date(cursor.year, cursor.month, day).getTime());
  const inRange = (day: number) =>
    rangeStart !== null && rangeEnd !== null && dayMs(day) > rangeStart && dayMs(day) < rangeEnd;
  const isEndpoint = (day: number) => (rangeStart !== null && dayMs(day) === rangeStart) || (rangeEnd !== null && dayMs(day) === rangeEnd);
  const isToday = (day: number) => isSameLocalDay(dayMs(day), todayMs);

  const dayStyle = (day: number) =>
    isEndpoint(day) ? s.dayEndpoint : inRange(day) ? s.dayInRange : isToday(day) ? s.dayToday : s.dayPlain;
  const labelStyle = (day: number) =>
    isEndpoint(day) ? s.dayEndpointLabel : inRange(day) ? s.dayInRangeLabel : isToday(day) ? s.dayTodayLabel : s.dayPlainLabel;

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const hint =
    rangeStart !== null && rangeEnd !== null
      ? `${monthDayLabel(rangeStart)} – ${monthDayLabel(rangeEnd)} · ${Math.round((rangeEnd - rangeStart) / 864e5) + 1} days`
      : rangeStart !== null
        ? `${monthDayLabel(rangeStart)} — pick an end day`
        : 'tap a start and end day';

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
        <Text style={[type.meta, { marginTop: space.xs }]}>{hint}</Text>

        <View style={s.monthNav}>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={12} accessibilityLabel="previous month">
            <Ionicons name="chevron-back" size={18} color={colors.muted} />
          </Pressable>
          <Text style={[type.body, { color: colors.text }]}>
            {MONTHS[cursor.month]} {cursor.year}
          </Text>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={12} accessibilityLabel="next month">
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </View>

        <View style={s.weekRow}>
          {grid.weekdays.map((d, i) => (
            <Text key={i} style={s.weekday}>{d}</Text>
          ))}
        </View>

        <View style={s.grid}>
          {/* leading blanks keep columns aligned */}
          {Array.from({ length: grid.leadingBlanks }, (_, i) => (
            <View key={`b${i}`} style={s.cell} />
          ))}
          {Array.from({ length: grid.daysInMonth }, (_, i) => i + 1).map((day) => (
            <Pressable key={day} style={[s.cell, dayStyle(day)]} onPress={() => tapDay(day)} accessibilityLabel={`day ${day}`}>
              <Text style={labelStyle(day)}>{day}</Text>
            </Pressable>
          ))}
          {grid.trailing.map((d) => (
            <View key={`t${d}`} style={[s.cell, s.dayDim]}>
              <Text style={s.dayDimLabel}>{d}</Text>
            </View>
          ))}
        </View>

        <View style={s.footer}>
          <Btn
            label="apply range"
            disabled={rangeStart === null || rangeEnd === null}
            onPress={() => router.replace('/swipe')}
          />
        </View>
      </View>
    </View>
  );
}

function monthDayLabel(ms: number): string {
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
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
