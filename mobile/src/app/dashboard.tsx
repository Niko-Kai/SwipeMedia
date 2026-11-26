import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Btn, Pill, Screen } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { isScreenshot } from '@/features/scopes/scopes';
import { useDashboardData } from '@/features/media/useDashboardData';

/** 01 dashboard — storage and scope on REAL MediaStore data (P1). */
type ScopeId = 'today' | 'yesterday' | 'last7Days' | 'range';

export default function Dashboard() {
  const router = useRouter();
  const { loading, stats, storage, savedSoFarBytes, trashItems, assets } = useDashboardData();
  const [selected, setSelected] = useState<ScopeId>('today');

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[type.meta, { marginTop: space.md }]}>scanning your library…</Text>
      </View>
    );
  }

  const usedBytes = storage ? storage.totalBytes - storage.freeBytes : 0;
  const usedGB = storage ? usedBytes / 1024 ** 3 : 0;
  const freeGB = storage ? storage.freeBytes / 1024 ** 3 : 0;

  // real thumbnails for the high-yield cards (v4: media, not drawn glyphs)
  const topVideo = assets.find((a) => a.mediaType === 'video');
  const screenshotThumbs = assets.filter((a) => isScreenshot(a)).slice(0, 4);

  const scopeCount = (id: ScopeId): number =>
    id === 'today' ? stats.today.count : id === 'yesterday' ? stats.yesterday.count : id === 'last7Days' ? stats.last7Days.count : -1;

  const dateRows: { id: ScopeId; label: string; detail: string; bytes: number | null }[] = [
    { id: 'today', label: 'today', detail: `${stats.today.count} items`, bytes: stats.today.bytes },
    { id: 'yesterday', label: 'yesterday', detail: `${stats.yesterday.count} items`, bytes: stats.yesterday.bytes },
    { id: 'last7Days', label: 'last 7 days', detail: `${stats.last7Days.count} items`, bytes: stats.last7Days.bytes },
    { id: 'range', label: 'pick a date', detail: 'any range you choose', bytes: null },
  ];

  return (
    <Screen scroll>
      {/* header: wordmark left · trash, gear, pro right (spec).
          trash badge renders only when the trash store has items (P3). */}
      <View style={s.header}>
        <Text style={s.wordmark}>swipe media</Text>
        <View style={s.headerRight}>
          <Pressable onPress={() => router.push('/paywall')} hitSlop={8} accessibilityLabel="pro">
            <Pill label="pro" tone="primary" />
          </Pressable>
          <Ionicons name="settings-outline" size={22} color={colors.text} accessibilityLabel="open settings" onPress={() => router.push('/settings')} />
          <Pressable onPress={() => router.push('/trash')} hitSlop={8} accessibilityLabel="open trash">
            <View style={s.trashBadgeWrap}>
              <Ionicons name="trash-outline" size={22} color={colors.text} />
              {trashItems > 0 && (
                <View style={s.trashBadge}>
                  <Text style={s.trashBadgeLabel}>{trashItems}</Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </View>

      <View style={s.figure}>
        <Text style={[type.hero, { fontSize: 44 }]}>{formatBytes(savedSoFarBytes)}</Text>
        <Text style={type.meta}>saved so far</Text>
        {storage && (
          <View style={{ marginTop: space.md }}>
            <View style={s.meter}>
              <View style={[s.meterFill, { flex: Math.max(usedBytes, 1) }]} />
              <View style={{ flex: Math.max(storage.freeBytes, 1) }} />
            </View>
            <View style={[s.meterLabels, { marginTop: space.xs }]}>
              <Text style={type.meta}>{usedGB.toFixed(1)} GB used</Text>
              <Text style={type.meta}>{freeGB.toFixed(1)} GB free</Text>
            </View>
          </View>
        )}
      </View>

      <Text style={[type.title, { fontSize: 20 }]}>clean what first?</Text>
      <View style={s.cardsRow}>
        <Pressable
          style={[s.cardBase, { flex: 1 }]}
          onPress={() =>
            stats.largeVideos.count === 0 ? router.push({ pathname: '/empty-deck', params: { scope: 'largeVideos' } }) : router.push('/swipe')
          }>
          {topVideo ? (
            <View style={s.videoThumb}>
              <Image source={{ uri: topVideo.uri }} style={s.videoThumbImage} contentFit="cover" />
              <View style={s.videoThumbBadge}>
                <Ionicons name="play" size={9} color={colors.onPrimary} />
              </View>
            </View>
          ) : (
            <View style={s.videoThumb}><Ionicons name="play" size={10} color={colors.muted} /></View>
          )}
          <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>large videos</Text>
          <Text style={type.meta}>{stats.largeVideos.count} · {formatBytes(stats.largeVideos.bytes)}</Text>
        </Pressable>
        <Pressable
          style={[s.cardBase, { flex: 1 }]}
          onPress={() =>
            stats.screenshots.count === 0 ? router.push({ pathname: '/empty-deck', params: { scope: 'screenshots' } }) : router.push('/gallery?scope=screenshots')
          }>
          {screenshotThumbs.length > 0 ? (
            <View style={s.miniGridRow}>
              {screenshotThumbs.slice(0, 4).map((a, i) => (
                <Image key={`${a.id}-${i}`} source={{ uri: a.uri }} style={s.miniGridCell} contentFit="cover" />
              ))}
            </View>
          ) : (
            <View style={s.miniGridRow}>
              {[0, 1, 2, 3].map((n) => <View key={n} style={s.miniGridCell} />)}
            </View>
          )}
          <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>screenshots</Text>
          <Text style={type.meta}>{stats.screenshots.count} · {formatBytes(stats.screenshots.bytes)}</Text>
        </Pressable>
      </View>

      <Text style={[type.body, { color: colors.muted, marginTop: space.md }]}>or by date</Text>
      <View style={s.list}>
        {dateRows.map((row) => {
          const isSel = selected === row.id;
          return (
            <Pressable
              key={row.id}
              style={[s.cardBase, s.scopeRow, isSel && s.scopeSelected]}
              onPress={() => {
                if (row.id === 'range') {
                  router.push('/pick-range');
                  setSelected('range');
                } else {
                  setSelected(row.id);
                }
              }}>
              <View style={{ flex: 1 }}>
                <Text style={[type.body, { color: isSel ? colors.text : colors.muted }]}>{row.label}</Text>
                <Text style={type.meta}>{row.detail}</Text>
              </View>
              {row.bytes !== null ? (
                <Text style={[type.body, { fontWeight: '700', color: isSel ? colors.primary : colors.text }]}>
                  {formatBytes(row.bytes)}
                </Text>
              ) : (
                <Text style={type.meta}>choose</Text>
              )}
              <View style={isSel && row.id !== 'range' ? s.radioSelected : s.radio} />
            </Pressable>
          );
        })}
      </View>

      <View style={s.footer}>
        <Btn
          label="start cleaning"
          onPress={() => {
            if (selected === 'range' || scopeCount(selected) > 0) router.push('/swipe');
            else router.push({ pathname: '/empty-deck', params: { scope: selected } });
          }}
        />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  loadingWrap: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { ...type.body, fontWeight: '700', fontSize: 18 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  trashBadgeWrap: { position: 'relative' },
  trashBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  trashBadgeLabel: { fontSize: 9, fontWeight: '700', color: colors.onPrimary, fontFamily: 'Inter' },
  figure: { gap: space.xs, marginTop: space.lg, marginBottom: space.lg },
  meter: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.cardAlt,
    overflow: 'hidden',
  },
  meterFill: { backgroundColor: colors.primary },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  cardsRow: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  cardBase: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  videoThumb: {
    height: 58,
    width: '100%',
    borderRadius: 8,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  videoThumbImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  videoThumbBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    height: 16,
    width: 16,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniGridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  miniGridCell: {
    height: 26,
    width: '48%',
    borderRadius: 6,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: { marginTop: space.md, gap: space.sm },
  scopeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  scopeSelected: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { height: 16, width: 16, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border },
  radioSelected: { height: 16, width: 16, borderRadius: 999, backgroundColor: colors.primary },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.lg },
});
