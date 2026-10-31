import { buildOsmComparison, decodePolyline6, placeFromNominatim, type ValhallaResponse } from './osm';
import { placeById } from './synthetic';
import type { CompareRequest, LngLat } from './types';

/** Test-only encoder, so the decoder is checked against an independent implementation. */
function encodePolyline6(points: LngLat[]): string {
  let prevLat = 0;
  let prevLon = 0;
  let out = '';
  const put = (value: number) => {
    let v = value < 0 ? ~(value << 1) : value << 1;
    while (v >= 0x20) {
      out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    out += String.fromCharCode(v + 63);
  };
  for (const [lon, lat] of points) {
    const la = Math.round(lat * 1e6);
    const lo = Math.round(lon * 1e6);
    put(la - prevLat);
    put(lo - prevLon);
    prevLat = la;
    prevLon = lo;
  }
  return out;
}

const path: LngLat[] = [[90.3963, 23.7318], [90.3959, 23.7351], [90.3955, 23.7389]];
const trip = (km: number, seconds: number) => ({
  summary: { length: km, time: seconds },
  legs: [{ shape: encodePolyline6(path) }],
});
const request = (id: string): CompareRequest => ({
  origin: placeById('tsc')!.coordinate,
  destination: placeById(id)!.coordinate,
  destinationId: id,
});

describe('decodePolyline6', () => {
  it('round-trips coordinates to 6 decimals', () => {
    expect(decodePolyline6(encodePolyline6(path))).toEqual(path);
  });
});

describe('buildOsmComparison', () => {
  const response: ValhallaResponse = { trip: trip(0.8, 600), alternates: [{ trip: trip(0.9, 720) }] };

  it('never assesses conditions for real streets, even inside the pilot box', () => {
    const res = buildOsmComparison(request('shahbag'), response);
    expect(res.coverageArea).toBe('PILOT');
    expect(res.recommendationStatus).toBe('ABSTAINED_INSUFFICIENT_EVIDENCE');
    expect(res.routes.every((r) => r.segments.length === 0)).toBe(true);
    expect(res.routes.some((r) => r.tags.includes('BETTER_OBSERVED'))).toBe(false);
    expect(res.routes.every((r) => r.conditionLabel === 'INSUFFICIENT_DATA')).toBe(true);
  });

  it('flags a trip outside the pilot area as not assessed', () => {
    const res = buildOsmComparison(request('gulshan'), response);
    expect(res.recommendationStatus).toBe('AREA_UNSUPPORTED');
    expect(res.routes.every((r) => r.conditionLabel === 'NOT_ASSESSED')).toBe(true);
  });

  it('converts distance and time, marks the fastest, and is not synthetic', () => {
    const res = buildOsmComparison(request('shahbag'), response);
    expect(res.routes.map((r) => [r.distanceM, r.etaMinutes])).toEqual([[800, 10], [900, 12]]);
    expect(res.routes[0].tags).toEqual(['FASTEST']);
    expect(res.synthetic).toBe(false);
    expect(res.safetyGuarantee).toBe(false);
  });
});

describe('placeFromNominatim', () => {
  it('uses Bangla and English names when present and falls back to the display name', () => {
    const place = placeFromNominatim({
      osm_type: 'node',
      osm_id: 9031839911,
      lat: '23.7373359',
      lon: '90.3961724',
      name: 'শাহবাগ',
      display_name: 'শাহবাগ, ঢাকা',
      namedetails: { 'name:bn': 'শাহবাগ', 'name:en': 'Shahbag' },
    });
    expect(place).toEqual({ id: 'osm:node:9031839911', name: { bn: 'শাহবাগ', en: 'Shahbag' }, coordinate: [90.3961724, 23.7373359] });
    expect(placeFromNominatim({ osm_type: 'way', osm_id: 1, lat: '23.7', lon: '90.4', display_name: 'Foo Road, Dhaka' }).name.en).toBe('Foo Road');
  });
});
