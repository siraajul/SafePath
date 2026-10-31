import type { StyleSpecification } from '@maplibre/maplibre-react-native';

/**
 * Basemap style. No tile provider is licensed yet (spec section 8.1: the public OSM tiles are not
 * for production), so by default the map is a plain background with the routes drawn on top.
 * Set EXPO_PUBLIC_MAP_STYLE_URL to a licensed style URL to add streets without changing code.
 */
export function mapStyleFor(scheme: 'light' | 'dark'): string | StyleSpecification {
  const url = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  if (url) return url;
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
