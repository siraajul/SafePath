import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import RouteMap from '@/components/route-map';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { boundsOf, distanceToPolyline, haversine, polylineLength } from '@/domain/geo';
import { buildSteps, type Step } from '@/domain/steps';
import { useComparison } from '@/hooks/use-comparison';
import { useFormat } from '@/hooks/use-format';
import { type Position, useLocationPermission } from '@/hooks/use-location';
import { useTheme } from '@/hooks/use-theme';
import { planStore } from '@/stores';

const OFF_ROUTE_METRES = 50;
const WALK_M_PER_MIN = 80;

const STEP_ICON: Record<Step['kind'], { ios: string; md: string }> = {
  start: { ios: 'arrow.up', md: 'arrow_upward' },
  left: { ios: 'arrow.turn.up.left', md: 'turn_left' },
  right: { ios: 'arrow.turn.up.right', md: 'turn_right' },
  arrive: { ios: 'flag.checkered', md: 'flag' },
};

export default function NavigationScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const { route: routeParam } = useLocalSearchParams<{ route?: string }>();
  const [routeId, setRouteId] = useState(routeParam ?? 'route_1');
  const { query, origin, destination } = useComparison();
  const route = query.data?.routes.find((r) => r.id === routeId) ?? query.data?.routes[0] ?? null;

  const permission = useLocationPermission();
  const [position, setPosition] = useState<Position | null>(null);
  const [manualStep, setManualStep] = useState(0);
  const network = Network.useNetworkState();

  // The user just chose to start navigating, so asking for location now is expected.
  const { state: permissionState, request: requestPermission } = permission;
  useEffect(() => {
    if (permissionState === 'undetermined') requestPermission();
  }, [permissionState, requestPermission]);

  useEffect(() => {
    if (permissionState !== 'granted') return;
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;
    Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5 }, (fix) => {
      setPosition({ coordinate: [fix.coords.longitude, fix.coords.latitude], accuracy: fix.coords.accuracy });
    }).then((s) => (cancelled ? s.remove() : (subscription = s)));
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [permissionState]);

  const steps = useMemo(() => (route ? buildSteps(route.coordinates) : []), [route]);

  if (!route || !origin || !destination || steps.length === 0) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ThemedText type="default">{query.isPending ? t('routes.finding') : t('detail.notFound')}</ThemedText>
        <Button variant="secondary" label={t('common.back')} onPress={() => router.back()} />
      </Screen>
    );
  }

  const gps = permissionState === 'granted' && position;
  let nearest = 0;
  if (gps) {
    let best = Infinity;
    route.coordinates.forEach((c, i) => {
      const d = haversine(position.coordinate, c);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
  }
  const stepIndex = gps
    ? Math.max(0, steps.reduce((acc, s, i) => (s.index <= nearest ? i : acc), 0))
    : Math.min(manualStep, steps.length - 1);
  const step = steps[stepIndex];
  const from = gps ? nearest : step.index;
  const remaining = Math.round(
    polylineLength(route.coordinates.slice(from)) +
      (gps && route.coordinates[from + 1] ? haversine(position.coordinate, route.coordinates[from + 1]) : 0),
  );
  const offRoute = gps && distanceToPolyline(position.coordinate, route.coordinates) > OFF_ROUTE_METRES;
  const instruction = t(`navigation.${step.kind}`, { heading: t(`navigation.heading.${step.heading}`) });
  const icon = STEP_ICON[step.kind];

  function reroute() {
    if (!position) return;
    planStore.set((p) => ({ ...p, origin: { kind: 'device' }, device: position }));
    setRouteId('route_1');
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <RouteMap
        label={t('navigation.title')}
        routes={[{ id: route.id, coordinates: route.coordinates, selected: true }]}
        segments={route.segments}
        origin={origin}
        destination={destination.coordinate}
        user={gps ? position.coordinate : null}
        bounds={boundsOf(route.coordinates)}
        height={Math.round(height * 0.36)}
      />

      <Card>
        <View style={styles.instruction} accessibilityLiveRegion="polite">
          <View style={[styles.icon, { backgroundColor: theme.brand }]}>
            <SymbolView name={{ ios: icon.ios as never, android: icon.md as never, web: icon.md as never }} size={28} tintColor={theme.onBrand} />
          </View>
          <View style={styles.instructionText}>
            <ThemedText type="heading">{instruction}</ThemedText>
            {step.kind !== 'arrive' && (
              <ThemedText type="small" themeColor="textSecondary">
                {t('navigation.then', { distance: f.distance(step.distanceM) })}
              </ThemedText>
            )}
          </View>
        </View>
        <ThemedText type="default">
          {t('navigation.remaining', { distance: f.distance(remaining), minutes: f.minutes(Math.max(1, Math.round(remaining / WALK_M_PER_MIN))) })}
        </ThemedText>
        {gps && position.accuracy != null && (
          <ThemedText type="caption" themeColor="textSecondary">
            {t('navigation.accuracy', { n: f.number(position.accuracy) })}
          </ThemedText>
        )}
      </Card>

      {permissionState !== 'granted' && <Notice kind="info" text={t('navigation.manual')} />}
      {permissionState === 'granted' && !position && <Notice kind="info" text={t('navigation.waiting')} />}
      {network.isInternetReachable === false && <Notice kind="warning" text={t('navigation.offline')} />}
      {offRoute && (
        <Card>
          <ThemedText type="default">{t('navigation.offRoute')}</ThemedText>
          <Button variant="secondary" label={t('navigation.reroute')} onPress={reroute} />
        </Card>
      )}

      {!gps && step.kind !== 'arrive' && (
        <Button variant="secondary" label={t('navigation.nextStep')} onPress={() => setManualStep((n) => n + 1)} />
      )}

      <View style={styles.actions}>
        <Button style={styles.action} variant="danger" label={t('navigation.help')} icon={{ ios: 'phone.fill', android: 'call', web: 'call' }} onPress={() => router.push('/help')} />
        <Button style={styles.action} variant="secondary" label={t('navigation.share')} icon={{ ios: 'person.2', android: 'group', web: 'group' }} onPress={() => router.push('/share')} />
      </View>
      <Button label={step.kind === 'arrive' ? t('navigation.arrived') : t('navigation.end')} onPress={() => router.replace('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  instruction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  instructionText: { flex: 1, gap: Spacing.half },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.two },
  action: { flex: 1 },
});
