import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PILOT_POLYGON } from '@/domain/synthetic';
import type { LngLat } from '@/domain/types';

import type { RouteMapProps } from './route-map.types';

const W = 400;

/** Web preview: MapLibre RN is native-only, so routes are drawn as plain SVG. */
export default function RouteMap({ routes = [], segments = [], showPilot, origin, destination, user, bounds, height = 320, label }: RouteMapProps) {
  const theme = useTheme();
  const [west, south, east, north] = bounds;
  const pad = 24;
  const H = Math.max(120, Math.round(height * (W / 420)));
  const sx = (W - pad * 2) / (east - west || 1);
  const sy = (H - pad * 2) / (north - south || 1);
  const s = Math.min(sx, sy);
  const offX = (W - (east - west) * s) / 2;
  const offY = (H - (north - south) * s) / 2;
  const pt = ([lon, lat]: LngLat) => `${(offX + (lon - west) * s).toFixed(1)},${(offY + (north - lat) * s).toFixed(1)}`;
  const line = (c: LngLat[]) => c.map(pt).join(' ');
  const dot = (c: LngLat) => pt(c).split(',').map(Number);

  const style = (evidence: string, condition: string | null) => {
    const kind = evidence === 'VERIFIED' ? (condition ?? 'GOOD') : evidence;
    return {
      GOOD: { stroke: theme.verified, width: 5, dash: undefined },
      CAUTION: { stroke: theme.caution, width: 5, dash: '12 4' },
      REPORTED: { stroke: theme.caution, width: 5, dash: '1 7' },
      OLD: { stroke: theme.unknown, width: 5, dash: '6 6' },
      UNKNOWN: { stroke: theme.unknown, width: 2, dash: undefined },
    }[kind as 'GOOD'];
  };
  const selected = routes.find((r) => r.selected);

  return (
    <View style={[styles.frame, { height, borderColor: theme.backgroundSelected }]}>
      <svg role="img" aria-label={label} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ background: theme.backgroundSelected }}>
        {showPilot && <polygon points={line(PILOT_POLYGON)} fill={theme.brand} fillOpacity={0.1} stroke={theme.brand} strokeWidth={2} strokeDasharray="8 5" />}
        {routes.filter((r) => !r.selected).map((r) => (
          <polyline key={r.id} points={line(r.coordinates)} fill="none" stroke={theme.textSecondary} strokeWidth={4} strokeDasharray="6 6" />
        ))}
        {selected && <polyline points={line(selected.coordinates)} fill="none" stroke={theme.brand} strokeWidth={segments.length ? 11 : 6} strokeLinecap="round" strokeLinejoin="round" />}
        {segments.map((seg) => {
          const st = style(seg.evidence, seg.condition);
          return <polyline key={seg.id} points={line(seg.coordinates)} fill="none" stroke={st.stroke} strokeWidth={st.width} strokeDasharray={st.dash} />;
        })}
        {origin && <circle cx={dot(origin)[0]} cy={dot(origin)[1]} r={8} fill={theme.background} stroke={theme.brand} strokeWidth={4} />}
        {destination && <circle cx={dot(destination)[0]} cy={dot(destination)[1]} r={9} fill={theme.brand} stroke={theme.background} strokeWidth={3} />}
        {user && <circle cx={dot(user)[0]} cy={dot(user)[1]} r={7} fill="#2f7cf6" stroke="#fff" strokeWidth={3} />}
      </svg>
      <ThemedText type="caption" themeColor="textSecondary" style={styles.caption}>
        Web preview
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: Spacing.three, overflow: 'hidden', borderWidth: 1 },
  caption: { position: 'absolute', right: Spacing.two, bottom: Spacing.one },
});
