import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import RouteMap from '@/components/route-map';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EvidenceLabel, kindOf, Legend } from '@/components/ui/evidence';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { boundsOf } from '@/domain/geo';
import { useComparison } from '@/hooks/use-comparison';
import { useFormat } from '@/hooks/use-format';

export default function RouteDetailScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const { route: routeId } = useLocalSearchParams<{ route?: string }>();
  const { query, origin, destination } = useComparison();
  const data = query.data;
  const route = data?.routes.find((r) => r.id === routeId) ?? null;

  if (!data || !route || !origin || !destination) {
    return (
      <Screen>
        <ThemedText type="default">{t('detail.notFound')}</ThemedText>
        <Button label={t('common.back')} variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const gaps = route.segments.filter((s) => s.evidence === 'UNKNOWN' || s.evidence === 'OLD').length;
  const percent = Math.round(route.observedLengthFraction * 100);
  const assessed = route.conditionLabel !== 'NOT_ASSESSED';

  return (
    <Screen>
      <Notice kind="synthetic" />

      <Card>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('detail.summary')}
        </ThemedText>
        <ThemedText type="heading">
          {f.minutes(route.etaMinutes)} · {f.distance(route.distanceM)}
        </ThemedText>
        <ThemedText type="default">{t(`routes.label.${route.conditionLabel}`)}</ThemedText>
        {assessed && (
          <ThemedText type="small" themeColor="textSecondary">
            {t('routes.observed', { percent: f.number(percent) })} · {t(`routes.confidence.${route.confidenceLabel}`)}
          </ThemedText>
        )}
        <ThemedText type="small">{t(`routes.status.${data.recommendationStatus}`)}</ThemedText>
      </Card>

      <RouteMap
        label={t('detail.title')}
        routes={[{ id: route.id, coordinates: route.coordinates, selected: true }]}
        segments={route.segments}
        showPilot
        origin={origin}
        destination={destination.coordinate}
        bounds={boundsOf(route.coordinates)}
        height={240}
      />

      {route.notices.map((n) => (
        <Notice key={n.key} kind="warning" text={t(`routes.notice.${n.key}`, { percent: f.number(n.percent ?? 0) })} />
      ))}

      {route.segments.length > 0 && (
        <>
          <ThemedText type="heading" accessibilityRole="header">
            {t('detail.segments')}
          </ThemedText>
          {gaps > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              {t('detail.gaps', { n: f.number(gaps) })}
            </ThemedText>
          )}
          <View style={styles.segments}>
            {route.segments.map((s, i) => {
              const kind = kindOf(s.evidence, s.condition);
              return (
                <Card key={s.id} style={styles.segment}>
                  <ThemedText type="smallBold">
                    {t('detail.segment', { n: f.number(i + 1) })} · {f.distance(s.lengthM)}
                  </ThemedText>
                  <EvidenceLabel kind={kind} text={s.evidence === 'VERIFIED' ? `${t('evidence.VERIFIED')}: ${t(`evidence.${s.condition ?? 'GOOD'}`)}` : t(`evidence.${s.evidence}`)} />
                  <ThemedText type="small">{t(`evidence.notes.${s.noteKey}`)}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {s.lastVerifiedAt ? t('evidence.lastVerified', { date: f.date(s.lastVerifiedAt) }) : t('evidence.noRecent')}
                  </ThemedText>
                </Card>
              );
            })}
          </View>
          <Legend />
        </>
      )}

      <Card>
        <ThemedText type="smallBold">{t('detail.provenance')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('detail.dataset')}: {data.datasetVersion}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('detail.scoring')}: {data.scoringVersion}
        </ThemedText>
      </Card>

      <ThemedText type="small" themeColor="textSecondary">
        {t('common.disclaimer')}
      </ThemedText>

      <Button label={t('detail.start')} icon={{ ios: 'location.north.fill', android: 'navigation', web: 'navigation' }} onPress={() => router.push({ pathname: '/navigation', params: { route: route.id } })} />
      <Button variant="secondary" label={t('detail.share')} icon={{ ios: 'person.2', android: 'group', web: 'group' }} onPress={() => router.push('/share')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segments: { gap: Spacing.two },
  segment: { gap: Spacing.one },
});
