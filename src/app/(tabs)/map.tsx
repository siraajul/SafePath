import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import RouteMap from '@/components/route-map';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { DATA_SOURCE } from '@/api';
import { DHAKA_BBOX } from '@/domain/osm';
import { PILOT_BBOX } from '@/domain/synthetic';

export default function MapScreen() {
  const { t } = useTranslation();
  return (
    <Screen tab>
      <ThemedText type="subtitle" accessibilityRole="header" style={styles.title}>
        {t('map.title')}
      </ThemedText>
      <Notice kind={DATA_SOURCE === 'synthetic' ? 'synthetic' : 'dev'} />
      <RouteMap label={t('map.title')} showPilot bounds={DATA_SOURCE === 'synthetic' ? PILOT_BBOX : DHAKA_BBOX} height={380} />
      <ThemedText type="small" themeColor="textSecondary">
        {t('map.note')}
      </ThemedText>
      <Button label={t('map.plan')} onPress={() => router.navigate('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 44, marginTop: Spacing.two },
});
