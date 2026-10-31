import { buildSteps } from './steps';
import type { LngLat } from './types';

describe('buildSteps', () => {
  it('starts and arrives on a straight line', () => {
    const steps = buildSteps([[90.4, 23.73], [90.4, 23.732], [90.4, 23.734]]);
    expect(steps.map((s) => s.kind)).toEqual(['start', 'arrive']);
    expect(steps[0].heading).toBe('N');
    expect(steps[0].distanceM).toBeGreaterThan(400);
  });

  it('adds a right turn when the path bends east', () => {
    const path: LngLat[] = [[90.4, 23.73], [90.4, 23.732], [90.402, 23.732], [90.404, 23.732]];
    const steps = buildSteps(path);
    expect(steps.map((s) => s.kind)).toEqual(['start', 'right', 'arrive']);
  });

  it('returns nothing for a single point', () => {
    expect(buildSteps([[90.4, 23.73]])).toEqual([]);
  });
});
