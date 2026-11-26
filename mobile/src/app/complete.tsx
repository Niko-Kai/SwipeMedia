import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import type { ElementRef } from 'react';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Btn, HeaderRow, MeterBar, Screen, Toast } from '@/components/ui';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatBytes } from '@/lib/bytes';
import { useSession } from '@/features/session/session-context';
import { sessionFreedBytes } from '@/features/session/session';
import { getStorageStats } from '../../modules/mediatools/src';
import type { StorageStats } from '../../modules/mediatools/src';

/** 04b complete — reward and share, over the applied session (P3).
 *  Share card renders into the app cache and goes to the system sheet —
 *  nothing is written to the camera roll (spec). */
export default function Complete() {
  const router = useRouter();
  const { state } = useSession();
  const cardRef = useRef<ElementRef<typeof View>>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageStats | null>(null);

  useEffect(() => {
    let active = true;
    getStorageStats()
      .then((s) => active && setStorage(s))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const freedBytes = sessionFreedBytes(state);
  const afterUsed = storage ? storage.totalBytes - storage.freeBytes : null;

  const share = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) return;
      // captureRef writes the PNG into the app's cache dir (never the gallery)
      const uri = await captureRef(cardRef, { format: 'png' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'share result' });
    } catch {
      setToast('sharing was cancelled');
    }
  };

  return (
    <Screen scroll>
      <HeaderRow back={false} />
      <View style={s.center}>
        <View style={s.checkBadge}><Text style={s.checkGlyph}>✓</Text></View>
        <Text style={[type.title, { marginTop: space.md }]}>{formatBytes(freedBytes)} freed!</Text>
        <Text style={[type.body, { color: colors.muted }]}>on this phone. nothing uploaded.</Text>
      </View>

      <View style={s.shareCard} collapsable={false} ref={cardRef}>
        <Text style={s.brand}>swipe media</Text>
        <Text style={s.date}>
          {new Date().toLocaleDateString('en-us', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <Text style={s.bigNumber}>{formatBytes(freedBytes)}</Text>
        <Text style={s.bigCaption}>freed on my phone today</Text>
        <View style={{ marginTop: space.md }}>
          <MeterBar
            progress={storage && afterUsed !== null ? afterUsed / storage.totalBytes : 0}
            height={8}
            trackColor="rgba(255,255,255,0.25)"
            fillColor="#FFFFFF"
          />
          <View style={s.meterLabels}>
            <Text style={s.cardMeta}>before</Text>
            <Text style={s.cardMeta}>after</Text>
          </View>
        </View>
        <View style={s.cardFooterRow}>
          <Text style={s.cardMeta}>no cloud. no upload.</Text>
          <Text style={s.cardMeta}>30-day undo</Text>
        </View>
      </View>

      {toast && <View style={{ marginTop: space.md }}><Toast msg={toast} /></View>}

      <Text style={[type.body, { color: colors.muted, marginTop: space.lg }]}>
        {formatBytes(freedBytes)} is reserved in 30-day trash.
      </Text>
      <Text
        style={[type.body, { color: colors.muted, marginTop: space.xs }]}
        onPress={() => router.push('/trash')}>
        empty trash to free space now →
      </Text>

      <View style={s.footer}>
        <Btn label="share result" onPress={share} />
        <View style={{ height: space.sm }} />
        <Btn label="done" tone="ghost" onPress={() => router.dismissTo('/dashboard')} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'flex-start', marginTop: space.md, marginBottom: space.lg, gap: space.xs },
  checkBadge: {
    height: 48,
    width: 48,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: { fontSize: 24, fontWeight: '700', color: colors.onPrimary },
  shareCard: {
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    padding: space.xl,
  },
  brand: { fontFamily: 'Inter', fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  date: { fontFamily: 'Inter', fontSize: 12, fontWeight: '500', color: colors.onPrimary, marginTop: 2 },
  bigNumber: { fontFamily: 'Inter', fontSize: 44, fontWeight: '700', color: colors.onPrimary, marginTop: space.md },
  bigCaption: { fontFamily: 'Inter', fontSize: 15, fontWeight: '500', color: colors.onPrimary },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  cardMeta: { fontFamily: 'Inter', fontSize: 12, fontWeight: '500', color: colors.onPrimary },
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xxl },
  footer: { marginTop: 'auto', marginBottom: space.lg, paddingTop: space.lg },
});
