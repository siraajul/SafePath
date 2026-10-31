/**
 * Where routes and places come from.
 * - `osm-dev`: public OpenStreetMap services (Valhalla, Nominatim, tiles). Development only:
 *   they are fair-use, have no uptime promise, and receive the coordinates you choose.
 * - `synthetic`: invented sample data. Used by the automated tests.
 * Set EXPO_PUBLIC_DATA_SOURCE=synthetic to switch. Replace with the self-hosted API for the pilot.
 */
export const DATA_SOURCE: 'osm-dev' | 'synthetic' =
  process.env.EXPO_PUBLIC_DATA_SOURCE === 'synthetic' ? 'synthetic' : 'osm-dev';

/** The OSM services block generic client names, so identify the app. */
export const USER_AGENT = 'SafePath-dev/0.1 (+https://github.com/siraajul/SafePath)';
