# Map, search and route data

The app reads routes and places through `src/api`. The source is chosen in `src/api/config.ts`.

| Source | Use | Where data comes from |
|---|---|---|
| `osm-dev` (default) | Development | OSM raster tiles, Nominatim search, public Valhalla pedestrian routing |
| `synthetic` | Automated tests | Invented sample data in `src/domain/synthetic.ts` |

Switch with `EXPO_PUBLIC_DATA_SOURCE=synthetic`. The Playwright config sets it, so tests never touch the network.

## Development only

The `osm-dev` services are free and fair-use, with no uptime promise.

- **Privacy:** the places a person chooses are sent to third-party servers. The app says so on screen.
- **Tiles** (`tile.openstreetmap.org`): light use only, with attribution and a distinct User-Agent. No prefetching or offline packs.
- **Search** (Nominatim): one request per second, no autocomplete, so search runs only on submit.
- **Routing** (`valhalla1.openstreetmap.de`): pedestrian costing with up to two alternates.

Before any real pilot, replace all three with a self-hosted Valhalla and tile source, or a licensed provider. `EXPO_PUBLIC_MAP_STYLE_URL` swaps the basemap without code changes.

## Conditions information

No audits exist yet, so real routes never get a conditions assessment. Inside the notional pilot box they show "data insufficient"; outside it, "conditions not assessed". The synthetic source exists only to exercise the comparison UI.
