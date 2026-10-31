import { decideRecommendation, observedLengthFraction } from './evidence';
import { buildComparison, PLACES, placeById } from './synthetic';
import type { CompareRequest } from './types';

const origin = placeById('tsc')!.coordinate;
const trip = (destinationId: string): CompareRequest => ({
  origin,
  destination: placeById(destinationId)!.coordinate,
  destinationId,
});

describe('recommendation gates', () => {
  it('recommends only when coverage is high and one route is clearly better', () => {
    const res = buildComparison(trip('shahbag'));
    expect(res.recommendationStatus).toBe('RECOMMENDED_BETTER_OBSERVED_CONDITIONS');
    expect(res.routes.filter((r) => r.tags.includes('BETTER_OBSERVED'))).toHaveLength(1);
  });

  it('abstains when observed coverage is below the threshold', () => {
    const res = buildComparison(trip('doel'));
    expect(res.recommendationStatus).toBe('ABSTAINED_INSUFFICIENT_EVIDENCE');
    expect(res.routes.every((r) => r.conditionLabel === 'INSUFFICIENT_DATA')).toBe(true);
  });

  it('abstains when a crossing is unknown even with high coverage', () => {
    const res = buildComparison(trip('curzon'));
    expect(res.recommendationStatus).toBe('ABSTAINED_CRITICAL_UNKNOWN');
    expect(res.routes.some((r) => observedLengthFraction(r.segments) >= 0.8)).toBe(true);
  });

  it('reports no material difference for near-identical routes', () => {
    expect(buildComparison(trip('ramna')).recommendationStatus).toBe('NO_MATERIAL_DIFFERENCE');
  });

  it('offers ordinary routes without assessment outside the pilot area', () => {
    const res = buildComparison(trip('gulshan'));
    expect(res.recommendationStatus).toBe('AREA_UNSUPPORTED');
    expect(res.routes.length).toBeGreaterThan(0);
    expect(res.routes.every((r) => r.conditionLabel === 'NOT_ASSESSED')).toBe(true);
  });

  it('never states a safety guarantee and is always flagged synthetic', () => {
    for (const p of PLACES) {
      const res = buildComparison(trip(p.id));
      expect(res.safetyGuarantee).toBe(false);
      expect(res.synthetic).toBe(true);
    }
  });

  it('is deterministic for the same trip', () => {
    expect(buildComparison(trip('shahbag'))).toEqual(buildComparison(trip('shahbag')));
  });

  it('abstains for an unsupported area regardless of routes', () => {
    expect(decideRecommendation('OUTSIDE', []).status).toBe('AREA_UNSUPPORTED');
  });
});
