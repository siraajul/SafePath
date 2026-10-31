import type { LngLat } from './types';

const R = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversine(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function polylineLength(coords: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversine(coords[i - 1], coords[i]);
  return total;
}

/** Initial bearing in degrees, 0 = north, clockwise. */
export function bearing(a: LngLat, b: LngLat): number {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
  const x =
    Math.cos(rad(a[1])) * Math.sin(rad(b[1])) -
    Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Point at fraction t (0..1) of the polyline's length. */
export function pointAlong(coords: LngLat[], t: number): LngLat {
  const target = polylineLength(coords) * t;
  let walked = 0;
  for (let i = 1; i < coords.length; i++) {
    const seg = haversine(coords[i - 1], coords[i]);
    if (walked + seg >= target && seg > 0) {
      const f = (target - walked) / seg;
      return [
        coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * f,
        coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * f,
      ];
    }
    walked += seg;
  }
  return coords[coords.length - 1];
}

/** Sub-polyline between fractions t0 and t1 of the total length. */
export function slicePolyline(coords: LngLat[], t0: number, t1: number): LngLat[] {
  const total = polylineLength(coords);
  const out: LngLat[] = [pointAlong(coords, t0)];
  let walked = 0;
  for (let i = 1; i < coords.length - 1; i++) {
    walked += haversine(coords[i - 1], coords[i]);
    const f = walked / total;
    if (f > t0 && f < t1) out.push(coords[i]);
  }
  out.push(pointAlong(coords, t1));
  return out;
}

/** Distance in metres from a point to the nearest part of a polyline. */
export function distanceToPolyline(p: LngLat, coords: LngLat[]): number {
  const kx = Math.cos(rad(p[1])) * ((Math.PI / 180) * R);
  const ky = (Math.PI / 180) * R;
  let best = Infinity;
  for (let i = 1; i < coords.length; i++) {
    const ax = (coords[i - 1][0] - p[0]) * kx;
    const ay = (coords[i - 1][1] - p[1]) * ky;
    const bx = (coords[i][0] - p[0]) * kx;
    const by = (coords[i][1] - p[1]) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
}

/** [west, south, east, north] for MapLibre camera bounds. */
export function boundsOf(points: LngLat[]): [number, number, number, number] {
  const lons = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

/** Coordinates rounded to about 100 m so a report never carries a precise position. */
export function generalise(p: LngLat): LngLat {
  return [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000];
}
