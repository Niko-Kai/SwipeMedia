import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { getLibraryPermissionStatus } from '@/features/media/library';
import { colors } from '@/theme/tokens';

/** entry: granted -> 01 dashboard; anything else -> 00 landing (P1 real check). */
export default function Index() {
  const [route, setRoute] = useState<'landing' | 'dashboard' | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const status = await getLibraryPermissionStatus();
      if (active) setRoute(status === 'granted' ? 'dashboard' : 'landing');
    })();
    return () => {
      active = false;
    };
  }, []);

  if (route === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return <Redirect href={route === 'dashboard' ? '/dashboard' : '/landing'} />;
}
