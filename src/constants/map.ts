import type { StyleSpecification } from '@maplibre/maplibre-react-native';

import { DATA_SOURCE, USER_AGENT } from '@/api/config';

export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';

/**
 * Basemap style.
 * - EXPO_PUBLIC_MAP_STYLE_URL wins when set (use this for a licensed or self-hosted style).
 * - In the development data source, OpenStreetMap's public tiles are used. Their policy allows
 *   light use with attribution and a distinct User-Agent, and forbids production, bulk or offline
 *   use, so this must be replaced before any real pilot.
 * - Otherwise the map is a plain background with the routes drawn on top.
 */
export function mapStyleFor(scheme: 'light' | 'dark'): string | StyleSpecification {
  const url = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  if (url) return url;

  if (DATA_SOURCE === 'osm-dev') {
    return {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          maxzoom: 19,
          attribution: OSM_ATTRIBUTION,
        },
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
          paint: scheme === 'dark' ? { 'raster-brightness-max': 0.55, 'raster-saturation': -0.5 } : {},
        },
      ],
    };
  }

  return {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': scheme === 'dark' ? '#101c2a' : '#e9edf3' },
      },
    ],
  };
}

/** Identifies the app to the OSM tile servers, as their usage policy requires. */
export const TILE_USER_AGENT = USER_AGENT;
