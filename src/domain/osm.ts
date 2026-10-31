import { decideRecommendation } from './evidence';
import { PILOT_BBOX } from './synthetic';
import type { CompareRequest, CompareResponse, LngLat, Place, RouteOption } from './types';

/** [west, south, east, north]. Trips outside this box are refused rather than sent to a router. */
export const SERVICE_AREA_BBOX: [number, number, number, number] = [90.25, 23.6, 90.6, 24.05];
/** Default framing for the map tab. */
export const DHAKA_BBOX: [number, number, number, number] = [90.3, 23.68, 90.5, 23.9];

const inBox = (p: LngLat, b: [number, number, number, number]) =>
  p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3];
export const inServiceArea = (p: LngLat) => inBox(p, SERVICE_AREA_BBOX);
const inPilot = (p: LngLat) => inBox(p, PILOT_BBOX);

/** Decodes an encoded polyline with 6 decimal digits (Valhalla's format) into [lon, lat]. */
export function decodePolyline6(encoded: string): LngLat[] {
  const out: LngLat[] = [];
  let index = 0;
  let lat = 0;
  let lon = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += next();
    lon += next();
    out.push([lon / 1e6, lat / 1e6]);
  }
  return out;
}

type ValhallaTrip = { summary: { length: number; time: number }; legs: { shape: string }[] };
export type ValhallaResponse = { trip: ValhallaTrip; alternates?: { trip: ValhallaTrip }[] };

function tripToRoute(trip: ValhallaTrip, index: number): RouteOption {
  const coordinates = trip.legs.flatMap((leg, i) => {
    const points = decodePolyline6(leg.shape);
    return i === 0 ? points : points.slice(1);
  });
  return {
    id: `route_${index + 1}`,
    etaMinutes: Math.max(1, Math.round(trip.summary.time / 60)),
    distanceM: Math.round(trip.summary.length * 1000),
    coordinates,
    segments: [],
    tags: [],
    conditionLabel: 'NOT_ASSESSED',
    observedLengthFraction: 0,
    confidenceLabel: 'LOW',
    notices: [],
  };
}

/**
 * Turns real routes into a comparison. There are no audits yet, so no route ever gets a
 * conditions assessment: nothing is invented for real streets.
 */
export function buildOsmComparison(request: CompareRequest, response: ValhallaResponse): CompareResponse {
  const area = inPilot(request.origin) && inPilot(request.destination) ? 'PILOT' : 'OUTSIDE';
  const routes = [response.trip, ...(response.alternates ?? []).map((a) => a.trip)].map(tripToRoute);
  const { status } = decideRecommendation(area, routes);
  const fastest = routes.reduce((a, b) => (b.etaMinutes < a.etaMinutes ? b : a), routes[0]);

  for (const r of routes) {
    if (r.id === fastest.id) r.tags.push('FASTEST');
    if (area === 'OUTSIDE') r.notices.push({ key: 'outsidePilot' });
    else {
      r.conditionLabel = 'INSUFFICIENT_DATA';
      r.notices.push({ key: 'coverage', percent: 0 });
    }
  }

  return {
    requestId: `req_${Date.now().toString(36)}`,
    datasetVersion: 'osm-live-dev',
    scoringVersion: 'none',
    coverageArea: area,
    safetyGuarantee: false,
    recommendationStatus: status,
    routes,
    source: 'OSM_DEV',
    synthetic: false,
  };
}

export type NominatimResult = {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  namedetails?: Record<string, string>;
};

export function placeFromNominatim(r: NominatimResult): Place {
  const fallback = r.name || r.display_name.split(',')[0].trim();
  return {
    id: `osm:${r.osm_type}:${r.osm_id}`,
    name: { bn: r.namedetails?.['name:bn'] ?? fallback, en: r.namedetails?.['name:en'] ?? fallback },
    coordinate: [Number(r.lon), Number(r.lat)],
  };
}

/** Well-known places for quick picks. Coordinates are approximate; routes snap to the street network. */
export const DHAKA_PLACES: Place[] = [
  { id: 'dhaka:shahbag', name: { bn: 'শাহবাগ', en: 'Shahbag' }, coordinate: [90.3955, 23.7389] },
  { id: 'dhaka:du', name: { bn: 'ঢাকা বিশ্ববিদ্যালয়', en: 'Dhaka University' }, coordinate: [90.3963, 23.7316] },
  { id: 'dhaka:motijheel', name: { bn: 'মতিঝিল', en: 'Motijheel' }, coordinate: [90.4172, 23.733] },
  { id: 'dhaka:farmgate', name: { bn: 'ফার্মগেট', en: 'Farmgate' }, coordinate: [90.3896, 23.758] },
  { id: 'dhaka:dhanmondi', name: { bn: 'ধানমন্ডি ২৭', en: 'Dhanmondi 27' }, coordinate: [90.374, 23.7549] },
  { id: 'dhaka:gulshan1', name: { bn: 'গুলশান ১', en: 'Gulshan 1' }, coordinate: [90.4165, 23.7806] },
  { id: 'dhaka:banani', name: { bn: 'বনানী', en: 'Banani' }, coordinate: [90.4066, 23.7937] },
  { id: 'dhaka:mohakhali', name: { bn: 'মহাখালী', en: 'Mohakhali' }, coordinate: [90.4005, 23.7782] },
  { id: 'dhaka:mirpur10', name: { bn: 'মিরপুর ১০', en: 'Mirpur 10' }, coordinate: [90.3687, 23.8069] },
  { id: 'dhaka:uttara3', name: { bn: 'উত্তরা সেক্টর ৩', en: 'Uttara Sector 3' }, coordinate: [90.3795, 23.8759] },
  { id: 'dhaka:kamalapur', name: { bn: 'কমলাপুর রেলস্টেশন', en: 'Kamalapur Railway Station' }, coordinate: [90.426, 23.733] },
  { id: 'dhaka:lalbagh', name: { bn: 'লালবাগ কেল্লা', en: 'Lalbagh Fort' }, coordinate: [90.3883, 23.7188] },
  { id: 'dhaka:sadarghat', name: { bn: 'সদরঘাট', en: 'Sadarghat' }, coordinate: [90.4064, 23.7084] },
  { id: 'dhaka:sangsad', name: { bn: 'জাতীয় সংসদ ভবন', en: 'National Parliament' }, coordinate: [90.3783, 23.7625] },
];
