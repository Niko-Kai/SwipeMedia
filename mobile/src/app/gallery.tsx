import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Btn, HeaderRow, Screen, Toast } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { useDashboardData } from '@/features/media/useDashboardData';
import { useSession } from '@/features/session/session-context';

/** 02 gallery — real MediaStore thumbnails, tap-select, floating dock (P1/P2).
 *  remove/compress stage the selection into the shared session (apply in 04/P3).
 *  scope param: 'screenshots' (from 01) or default today's set. */
export default function Gallery() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scope?: string }>();
  const scope = params.scope === 'screenshots' ? 'screenshots' : 'today';
  const { todayAssets, screenshotAssets, loading } = useDashboardData();
  const { start, dispatch } = useSession();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);

  const visible = scope === 'screenshots' ? screenshotAssets : todayAssets;

  const stage = (kind: 'remove' | 'compress') => {
    const picked = visible.filter((a) => selected.has(a.id));
    if (picked.length === 0) return;
    // compression is a video transcode in P4; photos have no transcode preset yet
    const target = kind === 'compress' ? picked.filter((a) => a.mediaType === 'video') : picked;
    if (target.length === 0) {
      setNote('compress works on videos — pick a video');
      return;
    }
    setNote(null);
    start(target); // fresh session from the batch
    for (const item of target) {
      // removals are the real thing; compression's delta is replaced by the real
      // transcode result during apply (04a)
      dispatch(
        kind === 'compress'
          ? { type: 'compress', item, newSizeBytes: Math.round(item.sizeBytes * 0.3) }
          : { type: 'remove', item }
      );
    }
    router.push('/confirm');
  };

  const count = selected.size;
  const selectedBytes = visible
    .filter((a) => selected.has(a.id))
    .reduce((sum, a) => sum + a.sizeBytes, 0);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.size === visible.length ? new Set() : new Set(visible.map((a) => a.id))));
  };

  const title = scope === 'screenshots' ? 'screenshots' : 'today';
  const totalBytes = visible.reduce((sum, a) => sum + a.sizeBytes, 0);

  return (
    <Screen>
      <HeaderRow
        back
        right={
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <Ionicons name="checkbox-outline" size={22} color={colors.text} accessibilityLabel="select all" onPress={toggleSelectAll} />
            <Ionicons name="swap-vertical-outline" size={22} color={colors.text} accessibilityLabel="swipe mode" onPress={() => router.push('/swipe')} />
          </View>
        }
      />

      <View style={s.titleBlock}>
        <Text style={[type.title, { fontSize: 28 }]}>{title}</Text>
        <Text style={type.meta}>
          {loading ? 'scanning…' : `${visible.length} items, ${formatBytes(totalBytes)}`}
        </Text>
      </View>

      <ScrollView style={s.gridScroll} contentContainerStyle={s.gridContent}>
        {chunk(visible, 3).map((row, r) => (
          <View key={r} style={s.gridRow}>
            {row.map((asset) => {
              const isSel = selected.has(asset.id);
              return (
                <Pressable
                  key={asset.id}
                  onPress={() => toggle(asset.id)}
                  style={[s.tile, isSel && s.tileSelected]}
                  accessibilityLabel={`select ${asset.filename}`}>
                  <Image source={{ uri: asset.uri }} style={s.thumb} contentFit="cover" />
                  {asset.mediaType === 'video' && (
                    <View style={s.durationChip}>
                      <Text style={s.durationText}>{formatDuration(asset.durationSec)}</Text>
                    </View>
                  )}
                  {isSel && (
                    <View style={s.checkBadge}>
                      <Text style={s.checkLabel}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
            {row.length < 3 && <View style={{ flex: 3 - row.length }} />}
          </View>
        ))}
        {visible.length === 0 && !loading && (
          <Text style={[type.meta, { padding: space.xl }]}>nothing in this scope yet.</Text>
        )}
      </ScrollView>

      {/* gradient scrim + floating dock over the bottom (spec) */}
      <LinearGradient
        colors={['rgba(20,18,27,0)', 'rgba(20,18,27,0.9)', '#14121B']}
        locations={[0, 0.35, 0.65]}
        style={s.dockScrim}>
        <View style={s.dock}>
          {note && <Toast msg={note} />}
          <View style={s.dockMeta}>
            <Text style={[type.body, { color: colors.text }]}>{count} selected</Text>
            <Text style={type.meta}>{formatBytes(selectedBytes)}</Text>
          </View>
          <View style={s.dockButtonsRow}>
            <View style={{ flex: 1 }}>
              <Btn label={`remove ${count}`} onPress={() => stage('remove')} />
            </View>
            <View style={{ flex: 1 }}>
              <Btn label={`compress ${count}`} tone="ghost" onPress={() => stage('compress')} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </Screen>
  );
}

function formatDuration(sec: number | null): string {
  const s = Math.max(0, Math.floor(sec ?? 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

const s = StyleSheet.create({
  titleBlock: { marginTop: space.sm, marginBottom: space.sm },
  gridScroll: { flex: 1 },
  gridContent: { paddingBottom: 170 },
  gridRow: { flexDirection: 'row' },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.canvas,
  },
  tileSelected: { borderWidth: 2.5, borderColor: colors.primary },
  thumb: { flex: 1, backgroundColor: colors.cardAlt },
  durationChip: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: { color: '#FFFFFF', fontSize: 10, fontFamily: 'Inter' },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: { color: colors.onPrimary, fontSize: 13, fontWeight: '700', fontFamily: 'Inter' },
  dockScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  dock: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.card,
    margin: space.lg,
    padding: space.lg,
    gap: space.sm,
  },
  dockMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dockButtonsRow: { flexDirection: 'row', gap: space.md },
});
