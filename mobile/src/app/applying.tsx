import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, HeaderRow, MeterBar, Pill, Screen, Toast } from '@/components/ui';
import { colors, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { useSession } from '@/features/session/session-context';
import { useEntitlement } from '@/features/billing/entitlement-context';
import { addTrashRows, addSaved } from '@/features/trashstore/trash';
import type { TrashRow } from '@/features/trashstore/trash';
import { requestTrash, compressVideo } from '../../modules/mediatools/src';

type Stage = 'checking' | 'compressing' | 'trashing' | 'done' | 'denied' | 'failed';

/** 04a applying — the real apply pipeline (P3+P4).
 *  Compress staged videos on-device (MediaTransformer, foreground service),
 *  then ONE system dialog trashes every removal + every compressed original
 *  (spec: "one 'allow' at the end trashes all 36 items").
 *  Free plan: one cleanup a day -> 05 paywall when spent (spec). */
export default function Applying() {
  const router = useRouter();
  const { state } = useSession();
  const { canCleanup, heightPx, recordCleanup } = useEntitlement();
  const [stage, setStage] = useState<Stage>('checking');
  const [progress, setProgress] = useState(0);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());

  const removedBytes = state.removed.reduce((sum, a) => sum + a.sizeBytes, 0);
  const compressSaved = state.compressed.reduce((sum, c) => sum + (c.item.sizeBytes - c.newSizeBytes), 0);
  const freedBytes = removedBytes + compressSaved;
  const batchCount = state.removed.length + state.compressed.length;

  useEffect(() => {
    let active = true;
    (async () => {
      // free-tier gate (spec 05: apply over the limit opens the paywall)
      if (!canCleanup) {
        router.replace('/paywall');
        return;
      }
      if (batchCount === 0) {
        setStage('done');
        return;
      }
      try {
        let realFreed = removedBytes;
        if (state.compressed.length > 0) {
          setStage('compressing');
          for (const [i, c] of state.compressed.entries()) {
            if (!active) return;
            setCurrentName(c.item.filename);
            setProgress(i / state.compressed.length);
            const result = await compressVideo(c.item.uri, heightPx);
            // only count a win when the copy is genuinely smaller; otherwise the
            // original stays and nothing is claimed (never inflate the savings)
            const saved = c.item.sizeBytes - result.sizeBytes;
            if (saved > 0) realFreed += saved;
          }
        }
        if (!active) return;
        setProgress(1);
        setStage('trashing');

        // every removal + every compressed ORIGINAL in one dialog
        const uris = [
          ...state.removed.map((a) => a.id),
          ...state.compressed.map((c) => c.item.id),
        ];
        const result = await requestTrash(uris, true);
        if (!active) return;
        if (!result.granted) {
          setStage('denied');
          setToast('the system trash dialog was declined — nothing was changed.');
          return;
        }
        const rows: TrashRow[] = [
          ...state.removed.map((a) => ({
            id: a.id, uri: a.uri, filename: a.filename,
            sizeBytes: a.sizeBytes, mediaType: a.mediaType, trashedAtMs: nowMs,
          })),
          ...state.compressed.map((c) => ({
            id: c.item.id, uri: c.item.uri, filename: c.item.filename,
            sizeBytes: c.item.sizeBytes, mediaType: c.item.mediaType, trashedAtMs: nowMs,
          })),
        ];
        await addTrashRows(rows);
        await addSaved(realFreed);
        await recordCleanup();
        if (!active) return;
        setStage('done');
        router.replace('/complete');
      } catch (e) {
        console.error('apply failed', e);
        if (active) {
          setStage('failed');
          setToast('the batch could not finish — nothing was trashed.');
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label =
    stage === 'compressing' ? `of ${state.compressed.length} videos compressed`
      : stage === 'trashing' ? 'trashing the batch'
        : stage === 'done' ? 'finished'
          : stage === 'denied' ? 'needs allow'
            : stage === 'failed' ? 'stopped'
              : 'starting…';

  return (
    <Screen scroll>
      <HeaderRow back={false} titleAlign="left" title="applying cleanup" />

      <View style={s.headRow}>
        <Pill label={stage === 'denied' || stage === 'failed' ? 'needs attention' : 'in progress'} />
      </View>

      <Text style={[type.hero, { fontSize: 40, marginTop: space.lg }]}>{Math.round(progress * 100)}%</Text>
      <Text style={type.meta}>{label}</Text>
      <View style={{ marginTop: space.md }}>
        <MeterBar progress={progress} height={12} />
        <Text style={[type.meta, { marginTop: space.xs }]}>{formatBytes(freedBytes)} to free</Text>
      </View>

      <Card style={{ marginTop: space.xl }}>
        <View style={s.jobHead}>
          <View style={s.jobThumb}>
            <Ionicons name="contract" size={14} color={colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.meta}>
              {stage === 'compressing' ? 'now compressing' : stage === 'trashing' ? 'now trashing' : 'batch'}
            </Text>
            <Text style={[type.body, { color: colors.text }]} numberOfLines={1}>
              {currentName ?? `${batchCount} items`}
            </Text>
            <Text style={type.meta}>{`one 'allow' trashes all ${batchCount} items`}</Text>
          </View>
        </View>
      </Card>

      <View style={s.noteCard}>
        <View style={s.noteSwatch}>
          <Ionicons name="flash" size={14} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.body, { color: colors.text }]}>keeps running in the background</Text>
          <Text style={type.meta}>trash holds everything for 30 days — free for every plan.</Text>
        </View>
      </View>

      {toast && <View style={{ marginTop: space.lg }}><Toast msg={toast} /></View>}

      <View style={s.footer}>
        {/* the only exit (v4) */}
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={[type.body, { color: colors.text, textAlign: 'center' }]}>cancel cleanup</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.md },
  jobHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  jobThumb: {
    height: 36,
    width: 36,
    borderRadius: 999,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    padding: space.lg,
    marginTop: space.lg,
  },
  noteSwatch: {
    height: 32,
    width: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 92, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.xl },
});
