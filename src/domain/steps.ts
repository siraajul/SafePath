import { bearing, haversine } from './geo';
import type { LngLat } from './types';

export type Heading = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export type Step = {
  kind: 'start' | 'left' | 'right' | 'arrive';
  /** Distance of the leg that follows this instruction; 0 for arrive. */
  distanceM: number;
  heading: Heading;
  /** Index into the route coordinates where this step begins. */
  index: number;
};

const HEADINGS: Heading[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const headingOf = (deg: number): Heading => HEADINGS[Math.round(deg / 45) % 8];

const TURN_THRESHOLD = 40;

const signedDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;

/** Derives simple turn-by-turn steps from a polyline. Cumulative bearing change smooths curves. */
export function buildSteps(coords: LngLat[]): Step[] {
  if (coords.length < 2) return [];
  const steps: Step[] = [];
  let legStart = 0;
  let legBearing = bearing(coords[0], coords[1]);
  let accumulated = 0;
  let previous = legBearing;
  const legLength = (from: number, to: number) => {
    let sum = 0;
    for (let i = from + 1; i <= to; i++) sum += haversine(coords[i - 1], coords[i]);
    return sum;
  };

  steps.push({ kind: 'start', distanceM: 0, heading: headingOf(legBearing), index: 0 });
  for (let i = 1; i < coords.length - 1; i++) {
    const next = bearing(coords[i], coords[i + 1]);
    accumulated += signedDelta(previous, next);
    previous = next;
    if (Math.abs(accumulated) >= TURN_THRESHOLD) {
      steps[steps.length - 1].distanceM = Math.round(legLength(legStart, i));
      steps.push({
        kind: accumulated > 0 ? 'right' : 'left',
        distanceM: 0,
        heading: headingOf(next),
        index: i,
      });
      legStart = i;
      legBearing = next;
      accumulated = 0;
    }
  }
  steps[steps.length - 1].distanceM = Math.round(legLength(legStart, coords.length - 1));
  steps.push({ kind: 'arrive', distanceM: 0, heading: headingOf(legBearing), index: coords.length - 1 });
  return steps;
}
