# QGIS Network Map Workflow

The CRM reads QGIS-compatible GeoJSON files from `public/gis/`. No ArcGIS API key is required.

## Start In QGIS

1. Install QGIS from `https://qgis.org/`.
2. Create a project with CRS `EPSG:4326 - WGS 84`.
3. Create or import these layers:
   - Fiber routes: line layer
   - Coverage zones: polygon layer
   - POPs, customer sites, and physical assets: point layers
4. Keep the project as the source of truth. The CRM currently gets POPs, sites, and assets from its own API; it gets fiber routes and coverage zones from GeoJSON.

## Export For The CRM

1. Right-click the QGIS layer and select `Export` then `Save Features As...`.
2. Select format `GeoJSON`.
3. Set CRS to `EPSG:4326 - WGS 84`.
4. Save the fiber layer as `public/gis/fiber-routes.geojson`.
5. Save the coverage layer as `public/gis/coverage-zones.geojson`.
6. Replace the sample files in this repository and refresh the CRM.

The CRM expects longitude then latitude coordinate order, which QGIS writes automatically for standard GeoJSON.

## Preview An Export Immediately

The Network Map has a `QGIS GeoJSON Preview` section in its control panel.

1. Choose `Fiber routes` or `Coverage zones`.
2. Click `Choose GeoJSON export` and select the file exported from QGIS.
3. The selected layer appears on the map immediately for review.
4. The preview is local to the current browser session. Use `Restore sample layers` to undo it.

When the layer is approved, replace the matching file in `public/gis/` so it becomes the shared application layer.

## Recommended Fields

Fiber route properties:

| Field | Example | Purpose |
| --- | --- | --- |
| `id` | `RT-MET-07` | Unique route identifier |
| `name` | `Phnom Penh metro ring` | Map and CRM label |
| `route_class` | `Metro ring` | Route classification |
| `utilization_pct` | `74` | Capacity utilization |
| `capacity_available_gbps` | `1.8` | Available capacity |
| `status` | `Active` | Operational state |
| `color` | `#00B39B` | Optional map color |

Coverage-zone properties:

| Field | Example | Purpose |
| --- | --- | --- |
| `id` | `COV-CENTRAL` | Unique zone identifier |
| `name` | `Central Phnom Penh serviceable zone` | Map label |
| `serviceability` | `Serviceable` | Feasibility result |
| `status` | `Standard install` | Delivery treatment |
| `color` | `#00B39B` | Optional map color |

## Production Direction

When the data grows, publish the QGIS data to PostGIS instead of copying GeoJSON files manually. The CRM backend can then expose protected GIS APIs for route feasibility, asset capacity, coverage, and field-service workflows.
