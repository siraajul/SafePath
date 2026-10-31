/**
 * Client for the route API. Shaped like the spec's `/api/v1` contract, but backed by synthetic
 * data until the FastAPI service exists. Keep the signatures; swap the bodies for `fetch` calls.
 */
import { buildComparison, searchPlaces as searchSynthetic, tooClose } from '@/domain/synthetic';
import type { CompareRequest, CompareResponse, Place } from '@/domain/types';

export type ApiErrorCode = 'INVALID_COORDINATE' | 'NO_WALKING_ROUTE' | 'ROUTING_UNAVAILABLE';

export class ApiError extends Error {
  constructor(public code: ApiErrorCode) {
    super(code);
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const validLngLat = ([lon, lat]: number[]) => Math.abs(lon) <= 180 && Math.abs(lat) <= 90;

export async function searchPlaces(query: string): Promise<Place[]> {
  await delay(150);
  return searchSynthetic(query);
}

export async function compareRoutes(request: CompareRequest): Promise<CompareResponse> {
  await delay(450);
  if (!validLngLat(request.origin) || !validLngLat(request.destination)) {
    throw new ApiError('INVALID_COORDINATE');
  }
  if (tooClose(request.origin, request.destination)) throw new ApiError('NO_WALKING_ROUTE');
  return buildComparison(request);
}
