import type {
  ConfidenceLabel,
  RecommendationStatus,
  RouteOption,
  RouteSegment,
} from './types';

/**
 * Proposed experiment threshold from the spec (section 7.5), not a proven safety standard.
 * ponytail: the real rule runs server-side; this is the client's synthetic stand-in.
 */
export const PILOT_MIN_COVERAGE = 0.8;
/** Two routes closer than this on observed-good length are treated as no material difference. */
export const MATERIAL_DIFFERENCE = 0.1;

const total = (segments: RouteSegment[]) => segments.reduce((sum, s) => sum + s.lengthM, 0);

/** Share of route length with recent, verified observations. Unknown and stale never count. */
export function observedLengthFraction(segments: RouteSegment[]): number {
  const all = total(segments);
  if (all === 0) return 0;
  const seen = segments.filter((s) => s.evidence === 'VERIFIED');
  return total(seen) / all;
}

/** Share of route length that is verified AND in good condition. */
export function goodLengthFraction(segments: RouteSegment[]): number {
  const all = total(segments);
  if (all === 0) return 0;
  return total(segments.filter((s) => s.evidence === 'VERIFIED' && s.condition === 'GOOD')) / all;
}

export function hasCriticalUnknown(segments: RouteSegment[]): boolean {
  return segments.some(
    (s) => s.critical === 'CROSSING' && (s.evidence === 'UNKNOWN' || s.evidence === 'OLD'),
  );
}

export function confidenceLabel(coverage: number): ConfidenceLabel {
  if (coverage >= PILOT_MIN_COVERAGE) return 'HIGH';
  if (coverage >= 0.5) return 'MEDIUM';
  return 'LOW';
}

/**
 * Decides whether a "better observed conditions" recommendation may be shown, following the
 * eligibility gates in spec section 7.6. Any failed gate abstains; missing data is never favourable.
 */
export function decideRecommendation(
  area: 'PILOT' | 'OUTSIDE',
  routes: Pick<RouteOption, 'id' | 'segments'>[],
): { status: RecommendationStatus; recommendedId: string | null } {
  const none = (status: RecommendationStatus) => ({ status, recommendedId: null });

  if (area === 'OUTSIDE') return none('AREA_UNSUPPORTED');
  if (routes.some((r) => hasCriticalUnknown(r.segments))) return none('ABSTAINED_CRITICAL_UNKNOWN');
  if (routes.some((r) => observedLengthFraction(r.segments) < PILOT_MIN_COVERAGE)) {
    return none('ABSTAINED_INSUFFICIENT_EVIDENCE');
  }
  if (routes.length < 2) return none('NO_MATERIAL_DIFFERENCE');

  const ranked = routes
    .map((r) => ({ id: r.id, good: goodLengthFraction(r.segments) }))
    .sort((a, b) => b.good - a.good);
  if (ranked[0].good - ranked[1].good < MATERIAL_DIFFERENCE) return none('NO_MATERIAL_DIFFERENCE');
  return { status: 'RECOMMENDED_BETTER_OBSERVED_CONDITIONS', recommendedId: ranked[0].id };
}
