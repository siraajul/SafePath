import type { LngLat, RouteSegment } from '@/domain/types';

export type MapRoute = { id: string; coordinates: LngLat[]; selected: boolean };

export type RouteMapProps = {
  routes?: MapRoute[];
  /** Evidence overlay drawn along the selected route. */
  segments?: RouteSegment[];
  showPilot?: boolean;
  origin?: LngLat | null;
  destination?: LngLat | null;
  user?: LngLat | null;
  /** [west, south, east, north]. */
  bounds: [number, number, number, number];
  height?: number;
  label: string;
};
