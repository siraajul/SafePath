import { Platform } from 'react-native';

import { placeFromNominatim, SERVICE_AREA_BBOX, type NominatimResult, type ValhallaResponse } from '@/domain/osm';
import type { CompareRequest, Place } from '@/domain/types';

import { ApiError } from './errors';
import { USER_AGENT } from './config';

const VALHALLA_URL = 'https://valhalla1.openstreetmap.de/route';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const TIMEOUT_MS = 20_000;
/** Nominatim allows at most one request per second. */
const NOMINATIM_GAP_MS = 1100;

// Browsers do not let pages set User-Agent, and they send a Referer instead.
const identity: Record<string, string> = Platform.OS === 'web' ? {} : { 'User-Agent': USER_AGENT };

async function request(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    throw new ApiError('ROUTING_UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRoutes(req: CompareRequest): Promise<ValhallaResponse> {
  const response = await request(VALHALLA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...identity },
    body: JSON.stringify({
      locations: [
        { lat: req.origin[1], lon: req.origin[0] },
        { lat: req.destination[1], lon: req.destination[0] },
      ],
      costing: 'pedestrian',
      alternates: 2,
    }),
  });
  if (response.ok) return (await response.json()) as ValhallaResponse;
  if (response.status === 400) {
    const body = (await response.json().catch(() => ({}))) as { error_code?: number };
    // 442: no path could be found between these points.
    throw new ApiError(body.error_code === 442 ? 'NO_WALKING_ROUTE' : 'INVALID_COORDINATE');
  }
  throw new ApiError('ROUTING_UNAVAILABLE');
}

let lastNominatim = 0;

/** Place search, limited to the Dhaka area. Call only when the user submits a search. */
export async function searchNominatim(query: string): Promise<Place[]> {
  const wait = lastNominatim + NOMINATIM_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastNominatim = Date.now();

  const [west, south, east, north] = SERVICE_AREA_BBOX;
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '8',
    namedetails: '1',
    countrycodes: 'bd',
    viewbox: `${west},${north},${east},${south}`,
    bounded: '1',
  });
  const response = await request(`${NOMINATIM_URL}?${params}`, { headers: { ...identity } });
  if (!response.ok) throw new ApiError('ROUTING_UNAVAILABLE');
  return ((await response.json()) as NominatimResult[]).map(placeFromNominatim);
}
