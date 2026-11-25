import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn, HeaderRow, Screen } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { gallery as mock } from '@/mock/ledger';

/** 03 gallery — select by tapping (user_flow.md §2).
 *  Full-bleed 3-column grid (chunked rows: immune to subpixel rounding),
 *  scrollable, with a floating selection dock over the bottom. P0 uses dark tiles;
 *  real thumbnails arrive in P1. */
export default function Gallery() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set(mock.selectedTiles));

  const count = selected.size;
  const perTileBytes = mock.selectedBytes / mock.selectedCount;
  const selectedBytes = count * perTileBytes;

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === mock.tileCount) return new Set();
      return new Set(Array.from({ length: mock.tileCount }, (_, i) => i));
    });
  };

  // chunk tiles into rows of 3
  const rows: number[][] = [];
  for (let i = 0; i < mock.tileCount; i += 3) {
    rows.push([0, 1, 2].map((j) => i + j).filter((n) => n < mock.tileCount));
  }

  return (
    <Screen>
      <HeaderRow
        back={false}
        right={
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <Ionicons name="checkbox-outline" size={22} color={colors.text} accessibilityLabel="select all" onPress={toggleSelectAll} />
            <Ionicons name="swap-vertical-outline" size={22} color={colors.text} accessibilityLabel="swipe mode" onPress={() => router.push('/swipe')} />
          </View>
        }
      />

      {/* design: big left-aligned title block below the icon row */}
      <View style={s.titleBlock}>
        <Text style={[type.title, { fontSize: 28 }]}>today</Text>
        <Text style={type.meta}>{mock.meta}</Text>
      </View>

      <ScrollView style={s.gridScroll} contentContainerStyle={s.gridContent}>
        {rows.map((row, r) => (
          <View key={r} style={s.gridRow}>
            {row.map((id) => {
              const isSel = selected.has(id);
              return (
                <Pressable
                  key={id}
                  onPress={() => toggle(id)}
                  style={[s.tile, isSel && s.tileSelected]}
                  accessibilityLabel={`select tile ${id + 1}`}
                >
                  {isSel && (
                    <View style={s.checkBadge}>
                      <Text style={s.checkLabel}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* floating dock over the bottom (spec: scrim + dock) */}
      <View style={s.dock}>
        <View style={s.dockMeta}>
          <Text style={[type.body, { color: colors.text }]}>{count} selected</Text>
          <Text style={type.meta}>{formatBytes(selectedBytes)}</Text>
        </View>
        <View style={s.dockButtonsRow}>
          <View style={{ flex: 1 }}>
            <Btn label={`remove ${count}`} onPress={() => router.push('/confirm')} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn label={`compress ${count}`} tone="ghost" onPress={() => router.push('/confirm')} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  titleBlock: { marginTop: space.sm, marginBottom: space.sm },
  gridScroll: { flex: 1 },
  gridContent: { paddingBottom: space.xl },
  gridRow: { flexDirection: 'row' },
  tile: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.canvas,
  },
  tileSelected: { borderColor: colors.primary },
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
  dock: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  dockMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dockButtonsRow: { flexDirection: 'row', gap: space.md },
});
