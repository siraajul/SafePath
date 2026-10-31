import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api';
import { RouteCard } from '@/components/route-card';
import RouteMap from '@/components/route-map';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Legend } from '@/components/ui/evidence';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { boundsOf } from '@/domain/geo';
import { useComparison } from '@/hooks/use-comparison';
import { usePreferences } from '@/hooks/use-preferences';
import { placeLabel } from '@/lib/place';

export default function RoutesScreen() {
  const { t } = useTranslation();
  const { language } = usePreferences();
  const { query, plan, origin, destination } = useComparison();
  const [picked, setPicked] = useState<string | null>(null);

  const data = query.data;
  const selectedId =
    picked ??
    data?.routes.find((r) => r.tags.includes('BETTER_OBSERVED'))?.id ??
    data?.routes.find((r) => r.tags.includes('FASTEST'))?.id ??
    null;
  const selected = data?.routes.find((r) => r.id === selectedId) ?? null;
  const code = query.error instanceof ApiError ? query.error.code : 'GENERIC';

  const originText = plan.origin?.kind === 'device' ? t('home.myLocation') : plan.origin?.place ? placeLabel(plan.origin.place, language) : '';

  return (
    <Screen>
      <Notice kind="synthetic" />
      <View style={styles.trip}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('routes.from')}: {originText}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('routes.to')}: {destination ? placeLabel(destination, language) : ''}
        </ThemedText>
      </View>

      {!origin || !destination ? (
        <Button label={t('common.back')} variant="secondary" onPress={() => router.back()} />
      ) : query.isPending ? (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ActivityIndicator />
          <ThemedText type="small" themeColor="textSecondary">
            {t('routes.finding')}
          </ThemedText>
        </View>
      ) : query.isError ? (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ThemedText type="default">{t(`routes.errors.${code}`)}</ThemedText>
          <Button label={t('common.retry')} variant="secondary" onPress={() => query.refetch()} />
        </View>
      ) : data ? (
        <>
          <Notice kind={data.recommendationStatus === 'RECOMMENDED_BETTER_OBSERVED_CONDITIONS' ? 'info' : 'warning'} text={t(`routes.status.${data.recommendationStatus}`)} />
          <RouteMap
            label={t('routes.title')}
            routes={data.routes.map((r) => ({ id: r.id, coordinates: r.coordinates, selected: r.id === selectedId }))}
            segments={selected?.segments}
            showPilot
            origin={origin}
            destination={destination.coordinate}
            bounds={boundsOf(data.routes.flatMap((r) => r.coordinates))}
            height={280}
          />
          {data.routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              selected={route.id === selectedId}
              onSelect={() => setPicked(route.id)}
              onDetails={() => router.push({ pathname: '/route-detail', params: { route: route.id } })}
            />
          ))}
          {data.coverageArea === 'PILOT' && <Legend />}
          <ThemedText type="small" themeColor="textSecondary">
            {t('common.disclaimer')}
          </ThemedText>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  trip: { gap: Spacing.one },
  center: { gap: Spacing.three, alignItems: 'flex-start', paddingVertical: Spacing.three },
});
