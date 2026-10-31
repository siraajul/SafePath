import { Camera, GeoJSONSource, Layer, Map, TransformRequestManager } from '@maplibre/maplibre-react-native';
import type { FilterSpecification } from '@maplibre/maplibre-react-native';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { mapStyleFor, TILE_USER_AGENT } from '@/constants/map';
import { useTheme } from '@/hooks/use-theme';
import { PILOT_POLYGON } from '@/domain/synthetic';
import type { EvidenceState } from '@/domain/types';

import type { RouteMapProps } from './route-map.types';

// OSM's tile servers block generic client names, so identify the app.
TransformRequestManager.addHeader({ id: 'osm-user-agent', name: 'User-Agent', value: TILE_USER_AGENT, match: /tile\.openstreetmap\.org/ });

const eq = (key: string, value: string) => ['==', ['get', key], value] as unknown as FilterSpecification;

/** Native map. MapLibre needs a development build, so Expo Go cannot show this. */
export default function RouteMap({ routes = [], segments = [], showPilot, origin, destination, user, bounds, height = 320, label }: RouteMapProps) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  const evidenceFeatures = {
    type: 'FeatureCollection' as const,
    features: segments.map((s) => ({
      type: 'Feature' as const,
      properties: { kind: s.evidence === 'VERIFIED' ? (s.condition ?? 'GOOD') : s.evidence },
      geometry: { type: 'LineString' as const, coordinates: s.coordinates },
    })),
  };
  const points = {
    type: 'FeatureCollection' as const,
    features: [
      origin && { kind: 'origin', c: origin },
      destination && { kind: 'destination', c: destination },
      user && { kind: 'user', c: user },
    ]
      .filter((p): p is { kind: string; c: [number, number] } => !!p)
      .map((p) => ({
        type: 'Feature' as const,
        properties: { kind: p.kind },
        geometry: { type: 'Point' as const, coordinates: p.c },
      })),
  };
  const selected = routes.find((r) => r.selected);
  const hasEvidence = segments.length > 0;

  const evidenceLine = (kind: EvidenceState | 'GOOD' | 'CAUTION', color: string, width: number, dash?: number[]) => (
    <Layer
      key={kind}
      id={`evidence-${kind}`}
      type="line"
      filter={eq('kind', kind)}
      layout={{ 'line-cap': dash ? 'butt' : 'round', 'line-join': 'round' }}
      paint={{ 'line-color': color, 'line-width': width, ...(dash ? { 'line-dasharray': dash } : {}) }}
    />
  );

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.frame, { height, borderColor: theme.backgroundSelected }]}>
      <Map style={styles.map} mapStyle={mapStyleFor(scheme)} compass={false} logo={false}>
        <Camera
          key={bounds.join(',')}
          initialViewState={{ bounds, padding: { top: 40, right: 40, bottom: 40, left: 40 } }}
        />

        {showPilot && (
          <GeoJSONSource id="pilot" data={{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [PILOT_POLYGON] } }}>
            <Layer id="pilot-fill" type="fill" paint={{ 'fill-color': theme.brand, 'fill-opacity': 0.1 }} />
            <Layer id="pilot-edge" type="line" paint={{ 'line-color': theme.brand, 'line-width': 2, 'line-dasharray': [3, 2] }} />
          </GeoJSONSource>
        )}

        {routes
          .filter((r) => !r.selected)
          .map((r) => (
            <GeoJSONSource key={r.id} id={`route-${r.id}`} data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: r.coordinates } }}>
              <Layer id={`line-${r.id}`} type="line" layout={{ 'line-cap': 'butt' }} paint={{ 'line-color': theme.textSecondary, 'line-width': 4, 'line-dasharray': [2, 2], 'line-opacity': 0.9 }} />
            </GeoJSONSource>
          ))}

        {selected && (
          <GeoJSONSource id="route-selected" data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: selected.coordinates } }}>
            <Layer id="selected-halo" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-color': theme.brand, 'line-width': hasEvidence ? 11 : 6 }} />
          </GeoJSONSource>
        )}

        {hasEvidence && (
          <GeoJSONSource id="evidence" data={evidenceFeatures}>
            {evidenceLine('UNKNOWN', theme.unknown, 3)}
            {evidenceLine('OLD', theme.unknown, 5, [1.5, 1.5])}
            {evidenceLine('REPORTED', theme.caution, 5, [0.1, 1.5])}
            {evidenceLine('CAUTION', theme.caution, 5, [3, 1])}
            {evidenceLine('GOOD', theme.verified, 5)}
          </GeoJSONSource>
        )}

        <GeoJSONSource id="points" data={points}>
          <Layer id="origin" type="circle" filter={eq('kind', 'origin')} paint={{ 'circle-radius': 8, 'circle-color': theme.background, 'circle-stroke-color': theme.brand, 'circle-stroke-width': 4 }} />
          <Layer id="destination" type="circle" filter={eq('kind', 'destination')} paint={{ 'circle-radius': 9, 'circle-color': theme.brand, 'circle-stroke-color': theme.background, 'circle-stroke-width': 3 }} />
          <Layer id="user" type="circle" filter={eq('kind', 'user')} paint={{ 'circle-radius': 7, 'circle-color': '#2f7cf6', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 }} />
        </GeoJSONSource>
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: Spacing.three, overflow: 'hidden', borderWidth: 1 },
  map: { flex: 1 },
});
