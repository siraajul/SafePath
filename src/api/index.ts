/**
 * Client for the route API. Shaped like the spec's `/api/v1` contract. The data comes from the
 * source chosen in `config.ts`; swap the bodies for the self-hosted service when it exists.
 */
import { buildOsmComparison, DHAKA_PLACES, inServiceArea } from '@/domain/osm';
import { buildComparison, PLACES, searchPlaces as searchSynthetic, tooClose } from '@/domain/synthetic';
import type { CompareRequest, CompareResponse, Place } from '@/domain/types';

import { DATA_SOURCE } from './config';
import { ApiError } from './errors';
import { fetchRoutes, searchNominatim } from './osm';

export { ApiError } from './errors';
export type { ApiErrorCode } from './errors';
export { DATA_SOURCE } from './config';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const validLngLat = ([lon, lat]: number[]) => Math.abs(lon) <= 180 && Math.abs(lat) <= 90;

/** Quick picks shown before any search. */
export const popularPlaces = (): Place[] => (DATA_SOURCE === 'synthetic' ? PLACES : DHAKA_PLACES);

/** True when search should run on every keystroke. Nominatim forbids that, so it runs on submit. */
export const searchesAsYouType = DATA_SOURCE === 'synthetic';

export async function searchPlaces(query: string): Promise<Place[]> {
  if (DATA_SOURCE === 'synthetic') {
    await delay(150);
    return searchSynthetic(query);
  }
  return searchNominatim(query);
}

export async function compareRoutes(request: CompareRequest): Promise<CompareResponse> {
  if (!validLngLat(request.origin) || !validLngLat(request.destination)) {
    throw new ApiError('INVALID_COORDINATE');
  }
  if (tooClose(request.origin, request.destination)) throw new ApiError('NO_WALKING_ROUTE');

  if (DATA_SOURCE === 'synthetic') {
    await delay(450);
    return buildComparison(request);
  }
  if (!inServiceArea(request.origin) || !inServiceArea(request.destination)) {
    throw new ApiError('OUTSIDE_SERVICE_AREA');
  }
  return buildOsmComparison(request, await fetchRoutes(request));
}
