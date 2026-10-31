import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function BrandMark({ size = 44 }: { size?: number }) {
  const theme = useTheme();

  return (
    <View
      accessible={false}
      style={[styles.tile, { width: size, height: size, borderRadius: size / 3.2, backgroundColor: theme.brand }]}>
      <Image
        source={require('@/assets/images/splash-icon.png')}
        style={{ width: size, height: size }}
        tintColor={theme.onBrand}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
