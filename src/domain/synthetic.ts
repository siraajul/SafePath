/**
 * SYNTHETIC DEMO DATA. None of these observations are real: no audit has been done.
 * Place names are only labels for illustration, and coordinates are approximate.
 * Replace with the real API before any pilot use (spec decision D-012).
 */
import {
  confidenceLabel,
  decideRecommendation,
  hasCriticalUnknown,
  observedLengthFraction,
} from './evidence';
import { haversine, polylineLength, slicePolyline } from './geo';
import type {
  CompareRequest,
  CompareResponse,
  EvidenceState,
  LngLat,
  NoteKey,
  Place,
  RouteOption,
  RouteSegment,
  Scenario,
  SegmentCondition,
} from './types';

export const DATASET_VERSION = 'synthetic-demo-001';
export const SCORING_VERSION = 'synthetic-rules-001';

/** [west, south, east, north] of the notional pilot area. */
export const PILOT_BBOX: [number, number, number, number] = [90.39, 23.726, 90.41, 23.745];

export const PILOT_POLYGON: LngLat[] = [
  [PILOT_BBOX[0], PILOT_BBOX[1]],
  [PILOT_BBOX[2], PILOT_BBOX[1]],
  [PILOT_BBOX[2], PILOT_BBOX[3]],
  [PILOT_BBOX[0], PILOT_BBOX[3]],
  [PILOT_BBOX[0], PILOT_BBOX[1]],
];

export const PLACES: Place[] = [
  { id: 'shahbag', name: { bn: 'শাহবাগ', en: 'Shahbag' }, coordinate: [90.3955, 23.7389], scenario: 'WELL_COVERED' },
  { id: 'tsc', name: { bn: 'টিএসসি', en: 'TSC' }, coordinate: [90.3963, 23.7318], scenario: 'SPARSE' },
  { id: 'curzon', name: { bn: 'কার্জন হল', en: 'Curzon Hall' }, coordinate: [90.4019, 23.7285], scenario: 'CRITICAL_UNKNOWN' },
  { id: 'museum', name: { bn: 'জাতীয় জাদুঘর', en: 'National Museum' }, coordinate: [90.3992, 23.7377], scenario: 'WELL_COVERED' },
  { id: 'ramna', name: { bn: 'রমনা পার্ক', en: 'Ramna Park' }, coordinate: [90.4045, 23.7387], scenario: 'NO_DIFFERENCE' },
  { id: 'doel', name: { bn: 'দোয়েল চত্বর', en: 'Doel Chattar' }, coordinate: [90.4008, 23.7312], scenario: 'SPARSE' },
  { id: 'dmc', name: { bn: 'ঢাকা মেডিকেল কলেজ', en: 'Dhaka Medical College' }, coordinate: [90.3978, 23.7288], scenario: 'CRITICAL_UNKNOWN' },
  { id: 'gulshan', name: { bn: 'গুলশান ১', en: 'Gulshan 1' }, coordinate: [90.4156, 23.7806], scenario: 'OUTSIDE_PILOT' },
];

export const placeById = (id: string) => PLACES.find((p) => p.id === id) ?? null;

export const isInsidePilot = (p: LngLat) =>
  p[0] >= PILOT_BBOX[0] && p[0] <= PILOT_BBOX[2] && p[1] >= PILOT_BBOX[1] && p[1] <= PILOT_BBOX[3];

/** Matches either script, plus the English name without case. */
export function searchPlaces(query: string): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return PLACES;
  return PLACES.filter((p) => p.name.en.toLowerCase().includes(q) || p.name.bn.includes(q));
}

// A tiny deterministic PRNG so the same trip always shows the same synthetic data.
function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** G good, C caution (both verified), R reported, O old, U unknown, X unknown crossing. */
type Code = 'G' | 'C' | 'R' | 'O' | 'U' | 'X';
type Profile = Partial<Record<Code, number>>;

const PROFILES: Record<Exclude<Scenario, 'OUTSIDE_PILOT'>, Profile[]> = {
  WELL_COVERED: [
    { G: 4, C: 4, O: 1, R: 1 },
    { G: 8, C: 1, O: 1 },
    { G: 6, C: 2, U: 1, R: 1 },
  ],
  SPARSE: [
    { G: 3, C: 2, U: 3, O: 2 },
    { G: 2, C: 3, U: 4, R: 1 },
  ],
  CRITICAL_UNKNOWN: [
    { G: 6, C: 2, U: 1, X: 1 },
    { G: 7, C: 2, O: 1 },
  ],
  NO_DIFFERENCE: [
    { G: 6, C: 3, O: 1 },
    { G: 6, C: 3, O: 1 },
  ],
};

const NOTES: Record<Code, NoteKey[]> = {
  G: ['lightingGood', 'footpathClear', 'crossingSupported'],
  C: ['lightingMixed', 'footpathNarrow', 'obstructionTemporary'],
  R: ['reportedUnverified'],
  O: ['observationOld'],
  U: ['noRecentData'],
  X: ['crossingUnknown'],
};

const VERIFIED_DATE = '2026-10-18';
const OLD_DATE = '2026-06-24';
const SEGMENT_COUNT = 10;
/** About 4.8 km/h. */
const WALK_M_PER_MIN = 80;

function codeToSegment(code: Code, id: string, coordinates: LngLat[], noteKey: NoteKey): RouteSegment {
  const evidence: EvidenceState =
    code === 'G' || code === 'C' ? 'VERIFIED' : code === 'R' ? 'REPORTED' : code === 'O' ? 'OLD' : 'UNKNOWN';
  const condition: SegmentCondition | null = code === 'G' ? 'GOOD' : code === 'C' ? 'CAUTION' : null;
  return {
    id,
    lengthM: Math.round(polylineLength(coordinates)),
    coordinates,
    evidence,
    condition,
    critical: code === 'X' ? 'CROSSING' : null,
    noteKey,
    lastVerifiedAt: evidence === 'VERIFIED' ? VERIFIED_DATE : evidence === 'OLD' ? OLD_DATE : null,
  };
}

function curve(origin: LngLat, destination: LngLat, bow: number): LngLat[] {
  const points: LngLat[] = [];
  const dx = destination[0] - origin[0];
  const dy = destination[1] - origin[1];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lift = Math.sin(Math.PI * t) * bow;
    // Perpendicular offset, in degrees, scaled by trip length.
    points.push([origin[0] + dx * t - dy * lift, origin[1] + dy * t + dx * lift]);
  }
  return points;
}

function buildSegments(coords: LngLat[], profile: Profile, rand: () => number, routeId: string): RouteSegment[] {
  const codes: Code[] = [];
  (Object.keys(profile) as Code[]).forEach((c) => {
    for (let i = 0; i < (profile[c] ?? 0); i++) codes.push(c);
  });
  while (codes.length < SEGMENT_COUNT) codes.push('U');
  for (let i = codes.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [codes[i], codes[j]] = [codes[j], codes[i]];
  }
  return codes.slice(0, SEGMENT_COUNT).map((code, i) => {
    const notes = NOTES[code];
    return codeToSegment(
      code,
      `${routeId}_s${i + 1}`,
      slicePolyline(coords, i / SEGMENT_COUNT, (i + 1) / SEGMENT_COUNT),
      notes[Math.floor(rand() * notes.length)],
    );
  });
}

export function buildComparison(request: CompareRequest): CompareResponse {
  const place = placeById(request.destinationId);
  const scenario: Scenario = place?.scenario ?? 'OUTSIDE_PILOT';
  const area = isInsidePilot(request.origin) && isInsidePilot(request.destination) && scenario !== 'OUTSIDE_PILOT' ? 'PILOT' : 'OUTSIDE';
  const rand = seeded(`${request.destinationId}:${request.origin.map((n) => n.toFixed(3)).join(',')}`);

  const bows = area === 'PILOT' && scenario === 'NO_DIFFERENCE' ? [0, 0.03] : [0, 0.14, -0.14];
  const profiles = area === 'OUTSIDE' ? [] : PROFILES[scenario as Exclude<Scenario, 'OUTSIDE_PILOT'>];
  const count = area === 'OUTSIDE' ? 2 : Math.min(profiles.length, bows.length);

  const routes: RouteOption[] = [];
  for (let i = 0; i < count; i++) {
    const id = `route_${i + 1}`;
    const coordinates = curve(request.origin, request.destination, bows[i]);
    const distanceM = Math.round(polylineLength(coordinates));
    const segments = area === 'OUTSIDE' ? [] : buildSegments(coordinates, profiles[i], rand, id);
    const coverage = observedLengthFraction(segments);
    routes.push({
      id,
      etaMinutes: Math.max(1, Math.round(distanceM / WALK_M_PER_MIN)),
      distanceM,
      coordinates,
      segments,
      tags: [],
      conditionLabel: area === 'OUTSIDE' ? 'NOT_ASSESSED' : 'OBSERVED',
      observedLengthFraction: coverage,
      confidenceLabel: confidenceLabel(coverage),
      notices: [],
    });
  }

  const { status, recommendedId } = decideRecommendation(area, routes);
  const fastest = routes.reduce((a, b) => (b.etaMinutes < a.etaMinutes ? b : a), routes[0]);

  for (const r of routes) {
    if (r.id === fastest.id) r.tags.push('FASTEST');
    if (r.id === recommendedId) {
      r.tags.push('BETTER_OBSERVED');
      r.conditionLabel = 'BETTER_OBSERVED';
    } else if (area === 'PILOT' && (r.observedLengthFraction < 0.8 || hasCriticalUnknown(r.segments))) {
      r.conditionLabel = 'INSUFFICIENT_DATA';
    }
    if (area === 'OUTSIDE') r.notices.push({ key: 'outsidePilot' });
    else {
      if (r.observedLengthFraction < 0.8) r.notices.push({ key: 'coverage', percent: Math.round(r.observedLengthFraction * 100) });
      if (hasCriticalUnknown(r.segments)) r.notices.push({ key: 'criticalCrossing' });
      if (r.segments.some((s) => s.evidence === 'OLD')) r.notices.push({ key: 'staleData' });
    }
  }

  return {
    requestId: `req_${Math.floor(rand() * 1e9).toString(36)}`,
    datasetVersion: DATASET_VERSION,
    scoringVersion: SCORING_VERSION,
    coverageArea: area === 'PILOT' ? 'PILOT' : 'OUTSIDE',
    safetyGuarantee: false,
    recommendationStatus: status,
    routes,
    source: 'SYNTHETIC',
    synthetic: true,
  };
}

export const SAME_PLACE_METRES = 20;
export const tooClose = (a: LngLat, b: LngLat) => haversine(a, b) < SAME_PLACE_METRES;
