import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Card, HeaderRow, Screen, Toast } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { daysLeft, heldRows, trashBytes } from '@/features/trashstore/trash-core';
import {
  loadTrashRows, removeTrashRows, clearTrash,
} from '@/features/trashstore/trash';
import type { TrashRow } from '@/features/trashstore/trash';
import { requestTrash, requestDelete } from '../../modules/mediatools/src';

/** 01b trash — the 30-day safety net over the app's real trash ledger.
 *  Restore is free for everyone; trashed files still take up space until
 *  emptied (user_flow.md v4 §2). */
export default function Trash() {
  const [rows, setRows] = useState<TrashRow[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    loadTrashRows().then((r) => active && setRows(r));
    return () => {
      active = false;
    };
  }, []);

  const held = heldRows(rows, nowMs);
  const bytes = trashBytes(held);

  const restoreRow = async (row: TrashRow) => {
    if (busy) return;
    setBusy(true);
    const result = await requestTrash([row.uri], false);
    if (result.granted) {
      const kept = await removeTrashRows([row.id]);
      setRows(kept);
      setToast(`${row.filename} restored`);
    } else {
      setToast('restore needs the system dialog');
    }
    setBusy(false);
  };

  const emptyTrash = async () => {
    if (busy || held.length === 0) return;
    setBusy(true);
    const result = await requestDelete(held.map((r) => r.uri));
    if (result.granted) {
      await clearTrash();
      setRows([]);
      setToast(`freed ${formatBytes(bytes)}`);
    } else {
      setToast('emptying needs the system dialog');
    }
    setBusy(false);
  };

  const newestFirst = [...held].sort((a, b) => b.trashedAtMs - a.trashedAtMs);

  return (
    <Screen scroll>
      <HeaderRow title="trash" titleAlign="left" />
      <View style={s.summary}>
        <Text style={[type.body, { fontWeight: '600', color: colors.text }]}>
          {held.length} items · {formatBytes(bytes)}
        </Text>
        <Text style={type.meta}>held for 30 days, then deleted for good.</Text>
      </View>

      {toast && <View style={{ marginBottom: space.sm }}><Toast msg={toast} /></View>}

      <Card style={{ gap: 0 }}>
        {newestFirst.slice(0, 5).map((row, i) => (
          <View key={row.id} style={[s.row, i > 0 && s.rowDivider]}>
            <View style={s.thumb}>
              {row.mediaType === 'video' ? (
                <Ionicons name="play" size={14} color={colors.muted} />
              ) : (
                <Ionicons name="image" size={14} color={colors.muted} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { color: colors.text }]}>{row.filename}</Text>
              <Text style={type.meta}>{formatBytes(row.sizeBytes)}</Text>
            </View>
            <View style={s.rowRight}>
              <View style={s.daysChip}>
                <Text style={s.daysLabel}>{daysLeft(row, nowMs)}d left</Text>
              </View>
              <Pressable onPress={() => restoreRow(row)} accessibilityLabel={`restore ${row.filename}`}>
                <Text style={s.restoreLabel}>restore</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {newestFirst.length === 0 && (
          <Text style={[type.meta, { textAlign: 'center', paddingVertical: space.lg }]}>
            trash is empty. removed items land here for 30 days.
          </Text>
        )}
        {newestFirst.length > 5 && (
          <Text style={[type.micro, { marginTop: space.md }]}>
            showing 5 of {newestFirst.length} · newest first
          </Text>
        )}
      </Card>

      <Text style={[type.meta, { marginTop: space.md }]}>
        these still take up space until you empty the trash.
      </Text>
      {held.length > 5 && (
        <Text style={[type.micro, { marginTop: space.xs }]}>
          showing 5 of {held.length} · newest first
        </Text>
      )}
      {held.length > 0 && (
        <Text
          style={[type.body, { color: colors.primary, marginTop: space.xs }]}
          onPress={emptyTrash}>
          {`empty trash to free ${formatBytes(bytes)} now →`}
        </Text>
      )}

      <View style={[s.footer, {}]}>
        <Btn label="empty trash now" tone="danger" onPress={emptyTrash} disabled={held.length === 0 || busy} />
        <Text style={[type.micro, { textAlign: 'center', marginTop: space.xs }]}>{"this can't be undone."}</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  summary: { marginBottom: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  daysChip: {
    backgroundColor: colors.cardAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  daysLabel: { fontSize: 11, fontWeight: '600', color: colors.primary, fontFamily: 'Inter' },
  restoreLabel: { fontSize: 13, fontWeight: '500', color: colors.muted, fontFamily: 'Inter' },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.lg },
});
