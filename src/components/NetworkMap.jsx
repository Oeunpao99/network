import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { apiRequest } from "../api";

const HAVERSINE_R = 6371000;

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return HAVERSINE_R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pathLength(pts) {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += haversine(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  }
  return total;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character]);
}

const popIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#BE5A2A;border:2px solid #fff;box-shadow:0 0 0 4px rgba(190,90,42,0.25);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const custIcon = L.divIcon({
  className: "",
  html: '<div style="width:11px;height:11px;border-radius:50%;background:#00B39B;border:2px solid #fff;box-shadow:0 0 0 4px rgba(0,179,155,0.22);"></div>',
  iconSize: [11, 11],
  iconAnchor: [5, 5],
});

const assetIcon = L.divIcon({
  className: "",
  html: '<div style="width:13px;height:13px;border-radius:3px;background:#7C65C4;border:2px solid #fff;box-shadow:0 0 0 4px rgba(124,101,196,0.22);"></div>',
  iconSize: [13, 13],
  iconAnchor: [6, 6],
});

function propertyValue(properties, key, fallback) {
  const value = properties?.[key];
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function mapColor(properties, fallback) {
  const color = propertyValue(properties, "color", fallback);
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : fallback;
}

function isFeatureCollection(value) {
  return value?.type === "FeatureCollection" && Array.isArray(value.features);
}

function NetworkMap({ active, pops, customerSites, assets, onPortAnalyze }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const routeGroup = useRef(null);
  const siteGroup = useRef(null);
  const networkGroup = useRef(null);
  const wmsLayer = useRef(null);
  const liveWp = useRef([]);
  const [fromId, setFromId] = useState(pops[0]?.id || "");
  const [toId, setToId] = useState(customerSites[0]?.id || "");
  const [result, setResult] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [layerVisibility, setLayerVisibility] = useState({
    coverage: true,
    routes: true,
    pops: true,
    customerSites: true,
    assets: true,
    liveQgis: false,
  });
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [gisLayers, setGisLayers] = useState({ fiberRoutes: null, coverageZones: null, error: null, source: "LOADING" });
  const [mapQuery, setMapQuery] = useState("");
  const [importType, setImportType] = useState("fiberRoutes");
  const [gisMessage, setGisMessage] = useState("");
  const fromIdRef = useRef(fromId);
  const toIdRef = useRef(toId);
  const popsRef = useRef(pops);
  const custRef = useRef(customerSites);
  fromIdRef.current = fromId;
  toIdRef.current = toId;
  popsRef.current = pops;
  custRef.current = customerSites;

  async function loadSampleGisLayers(showMessage = false) {
    try {
      const [routeResponse, coverageResponse, kampotRouteResponse, kampotCoverageResponse] = await Promise.all([
        fetch("/gis/fiber-routes.geojson"),
        fetch("/gis/coverage-zones.geojson"),
        fetch("/gis/kampot-fiber-routes.geojson"),
        fetch("/gis/kampot-coverage-zones.geojson"),
      ]);
      if (!routeResponse.ok || !coverageResponse.ok || !kampotRouteResponse.ok || !kampotCoverageResponse.ok) throw new Error("One or more GIS layers could not be loaded.");
      const [baseRoutes, baseCoverage, kampotRoutes, kampotCoverage] = await Promise.all([routeResponse.json(), coverageResponse.json(), kampotRouteResponse.json(), kampotCoverageResponse.json()]);
      if (!isFeatureCollection(baseRoutes) || !isFeatureCollection(baseCoverage) || !isFeatureCollection(kampotRoutes) || !isFeatureCollection(kampotCoverage)) throw new Error("GIS files must be GeoJSON FeatureCollections.");
      const fiberRoutes = { ...baseRoutes, features: [...baseRoutes.features, ...kampotRoutes.features] };
      const coverageZones = { ...baseCoverage, features: [...baseCoverage.features, ...kampotCoverage.features] };
      setGisLayers({ fiberRoutes, coverageZones, error: null, source: "QGIS + KAMPOT DEMO" });
      if (showMessage) setGisMessage("Sample QGIS layers restored.");
    } catch (error) {
      setGisLayers({ fiberRoutes: null, coverageZones: null, error: error.message, source: "LOAD ERROR" });
    }
  }

  useEffect(() => {
    loadSampleGisLayers();
  }, []);

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([11.575, 104.918], 12.3);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    siteGroup.current = L.layerGroup().addTo(map);
    routeGroup.current = L.layerGroup().addTo(map);
    networkGroup.current = L.layerGroup().addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const group = siteGroup.current;
    if (!group) return;
    group.clearLayers();
    if (layerVisibility.pops) pops.forEach((s) => {
      L.marker([s.lat, s.lng], { icon: popIcon })
        .addTo(group)
        .bindPopup(
          `<div class="pop-title">${escapeHtml(s.name)}</div>POP / Exchange<br>Ports: ${s.portsUsed}/${s.portsTotal} used`
        )
        .on("click", () => setSelectedFeature({ type: "POP / Exchange", title: s.name, detail: `${s.portsUsed}/${s.portsTotal} ports used · ${s.switchId}` }));
    });
    if (layerVisibility.customerSites) customerSites.forEach((s) => {
      L.marker([s.lat, s.lng], { icon: custIcon })
        .addTo(group)
        .bindPopup(`<div class="pop-title">${escapeHtml(s.name)}</div>Customer site`)
        .on("click", () => setSelectedFeature({ type: "Customer site", title: s.name, detail: "Serviceability and order location" }));
    });
    if (layerVisibility.assets) assets.forEach((asset) => {
      L.marker([asset.lat, asset.lng], { icon: assetIcon })
        .addTo(group)
        .bindPopup(
          `<div class="pop-title">${escapeHtml(asset.name)}</div>${escapeHtml(asset.assetType)}<br>Capacity: ${asset.capacityUsed}/${asset.capacityTotal} ${escapeHtml(asset.capacityUnit)}`
        )
        .on("click", () => setSelectedFeature({ type: asset.assetType, title: asset.name, detail: `${asset.capacityUsed}/${asset.capacityTotal} ${asset.capacityUnit} used · ${asset.status}` }));
    });
  }, [pops, customerSites, assets, layerVisibility]);

  useEffect(() => {
    const group = networkGroup.current;
    if (!group) return;
    group.clearLayers();

    if (layerVisibility.coverage && gisLayers.coverageZones) {
      L.geoJSON(gisLayers.coverageZones, {
        style: (feature) => {
          const properties = feature.properties || {};
          const color = mapColor(properties, "#00B39B");
          return {
            color,
            weight: 1.5,
            fillColor: color,
            fillOpacity: 0.11,
            dashArray: propertyValue(properties, "status", "") === "Survey required" ? "5,5" : undefined,
          };
        },
        onEachFeature: (feature, layer) => {
          const properties = feature.properties || {};
          const name = propertyValue(properties, "name", "Unnamed coverage zone");
          const status = propertyValue(properties, "status", "Status not supplied");
          layer.bindPopup(`<div class="pop-title">${escapeHtml(name)}</div>${escapeHtml(status)}`);
          layer.on("click", () => setSelectedFeature({ type: "Coverage zone", title: name, detail: `${propertyValue(properties, "id", "No ID")} · ${propertyValue(properties, "serviceability", status)}` }));
        },
      }).addTo(group);
    }

    if (layerVisibility.routes && gisLayers.fiberRoutes) {
      L.geoJSON(gisLayers.fiberRoutes, {
        style: (feature) => ({
          color: mapColor(feature.properties, "#00B39B"),
          weight: 3.5,
          opacity: 0.82,
        }),
        onEachFeature: (feature, layer) => {
          const properties = feature.properties || {};
          const name = propertyValue(properties, "name", "Unnamed fiber route");
          const capacity = `${propertyValue(properties, "utilization_pct", "-")}% utilized · ${propertyValue(properties, "capacity_available_gbps", "-")} Gbps available`;
          layer.bindPopup(`<div class="pop-title">${escapeHtml(name)}</div>${escapeHtml(propertyValue(properties, "id", "No ID"))}<br>${escapeHtml(capacity)}`);
          layer.on("click", () => setSelectedFeature({ type: "Fiber route", title: name, detail: `${propertyValue(properties, "id", "No ID")} · ${capacity}` }));
        },
      }).addTo(group);
    }
  }, [gisLayers, layerVisibility]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (layerVisibility.liveQgis && !wmsLayer.current) {
      wmsLayer.current = L.tileLayer.wms("/wms/", {
        layers: "fiber-routes,coverage-zones",
        format: "image/png",
        transparent: true,
        version: "1.3.0",
        opacity: 0.85,
      }).addTo(map);
    } else if (!layerVisibility.liveQgis && wmsLayer.current) {
      map.removeLayer(wmsLayer.current);
      wmsLayer.current = null;
    }
  }, [layerVisibility.liveQgis]);

  useEffect(() => {
    if (!fromId && pops[0]) setFromId(pops[0].id);
    if (!toId && customerSites[0]) setToId(customerSites[0].id);
  }, [fromId, toId, pops, customerSites]);

  useEffect(() => {
    if (mapInstance.current && active) {
      setTimeout(() => mapInstance.current.invalidateSize(), 60);
    }
  }, [active]);

  useEffect(() => {
    const group = routeGroup.current;
    const map = mapInstance.current;
    if (!group || !map) return;

    group.clearLayers();
    liveWp.current = waypoints;
    if (waypoints.length < 2) return;

    const polyline = L.polyline(waypoints, {
      color: "#00B39B",
      weight: 4,
      dashArray: "6,6",
      opacity: 0.9,
    }).addTo(group);
    polyline.on("mouseover", () => polyline.setStyle({ weight: 5, opacity: 1 }));
    polyline.on("mouseout", () => polyline.setStyle({ weight: 4, opacity: 0.9 }));

    polyline.on("click", function (e) {
      L.DomEvent.stopPropagation(e);
      const latlngs = this.getLatLngs();
      const clickPt = map.latLngToContainerPoint(e.latlng);
      let minDist = Infinity;
      let insertAt = latlngs.length;
      for (let i = 0; i < latlngs.length - 1; i++) {
        const a = map.latLngToContainerPoint(latlngs[i]);
        const b = map.latLngToContainerPoint(latlngs[i + 1]);
        const d = L.LineUtil.pointToSegmentDistance(clickPt, a, b);
        if (d < minDist) { minDist = d; insertAt = i + 1; }
      }
      if (minDist < 30) {
        const c = [...liveWp.current];
        c.splice(insertAt, 0, [e.latlng.lat, e.latlng.lng]);
        setWaypoints(c);
      }
    });

    const markers = waypoints.map((wp, i) => {
      const isFirst = i === 0;
      const isLast = i === waypoints.length - 1;
      const color = isFirst ? "#BE5A2A" : isLast ? "#00B39B" : "#7C65C4";
      const size = isFirst || isLast ? 16 : 20;

      const marker = L.marker(wp, {
        draggable: true,
        icon: L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;cursor:grab;box-shadow:0 0 0 4px ${color}55, 0 2px 8px rgba(0,0,0,0.25);"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
      }).addTo(group);
      marker.on("mouseover", function () { this.setZIndexOffset(1000); });
      marker.on("mouseout", function () { this.setZIndexOffset(0); });

      function recalcResult(pts) {
        const from = popsRef.current.find((s) => s.id === fromIdRef.current);
        const to = custRef.current.find((s) => s.id === toIdRef.current);
        if (!from || !to || pts.length < 2) return;
        const straight = haversine(from.lat, from.lng, to.lat, to.lng);
        const routed = pathLength(pts);
        const spools = Math.ceil(routed / 500);
        const hours = Math.max(2, Math.round((routed / 180) * 2) / 2);
        const nextPort = from.portsUsed + 1;
        setResult({
          straight, routed, spools, hours,
          port: `${from.switchId} · Port ${nextPort} of ${from.portsTotal} (${from.name})`,
        });
      }

      marker.on("drag", function () {
        const pos = this.getLatLng();
        const current = [...liveWp.current];
        current[i] = [pos.lat, pos.lng];
        polyline.setLatLngs(current);
        liveWp.current = current;
        recalcResult(current);
      });

      marker.on("dragend", function () {
        const pos = this.getLatLng();
        const current = [...liveWp.current];
        current[i] = [pos.lat, pos.lng];
        liveWp.current = current;
        recalcResult(current);
        setWaypoints(current);
      });

      marker.on("dblclick", function (e) {
        if (waypoints.length <= 2) return;
        L.DomEvent.stopPropagation(e);
        const next = waypoints.filter((_, idx) => idx !== i);
        setWaypoints(next);
      });

      return marker;
    });

    map.fitBounds(polyline.getBounds(), { padding: [60, 60] });
  }, [waypoints]);

  useEffect(() => {
    if (waypoints.length < 2) {
      setResult(null);
      return;
    }
    const from = pops.find((s) => s.id === fromId);
    const to = customerSites.find((s) => s.id === toId);
    if (!from || !to) return;

    const straight = haversine(from.lat, from.lng, to.lat, to.lng);
    const routed = pathLength(waypoints);
    const spools = Math.ceil(routed / 500);
    const hours = Math.max(2, Math.round((routed / 180) * 2) / 2);
    const nextPort = from.portsUsed + 1;

    setResult({
      straight,
      routed,
      spools,
      hours,
      port: `${from.switchId} · Port ${nextPort} of ${from.portsTotal} (${from.name})`,
    });
  }, [waypoints, fromId, toId, pops, customerSites]);

  function handleEstimate() {
    const from = pops.find((s) => s.id === fromId);
    const to = customerSites.find((s) => s.id === toId);
    if (!from || !to) return;

    const dx = (to.lng - from.lng) / 4;
    const dy = (to.lat - from.lat) / 4;
    setWaypoints([
      [from.lat, from.lng],
      [from.lat + dy * 1 + 0.003, from.lng + dx * 1 - 0.002],
      [from.lat + dy * 2 + 0.004, from.lng + dx * 2 - 0.003],
      [from.lat + dy * 3 + 0.003, from.lng + dx * 3 - 0.002],
      [to.lat, to.lng],
    ]);
  }

  function fmtDist(meters) {
    return meters < 1000
      ? `${Math.round(meters)} m`
      : `${(meters / 1000).toFixed(2)} km`;
  }

  function toggleLayer(layer) {
    setLayerVisibility((current) => ({ ...current, [layer]: !current[layer] }));
  }

  function handleGisImport(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const layer = JSON.parse(String(reader.result));
        if (!isFeatureCollection(layer)) throw new Error("The selected file is not a GeoJSON FeatureCollection.");
        const layerKey = importType === "fiberRoutes" ? "fiber-routes" : "coverage-zones";
        setGisMessage(`Saving ${file.name} to the server...`);
        await apiRequest(`/api/gis/${layerKey}`, { method: "PUT", body: JSON.stringify(layer) });
        const label = importType === "fiberRoutes" ? "fiber route" : "coverage zone";
        setGisLayers((current) => ({ ...current, [importType]: layer, error: null, source: `IMPORTED ${label.toUpperCase()}` }));
        setLayerVisibility((current) => ({ ...current, [importType === "fiberRoutes" ? "routes" : "coverage"]: true }));
        setGisMessage(`${file.name} imported and saved as ${label} data.`);
      } catch (error) {
        setGisMessage(error.message || "The selected GIS file could not be imported.");
      }
    };
    reader.onerror = () => setGisMessage("The selected GIS file could not be read.");
    reader.readAsText(file);
  }

  function handleMapSearch(event) {
    event.preventDefault();
    const query = mapQuery.trim().toLowerCase();
    const map = mapInstance.current;
    if (!query || !map) return;

    const pointFeature = [
      ...pops.map((item) => ({ type: "POP / Exchange", title: item.name, detail: `${item.portsUsed}/${item.portsTotal} ports used · ${item.switchId}`, point: [item.lat, item.lng], layer: "pops" })),
      ...customerSites.map((item) => ({ type: "Customer site", title: item.name, detail: "Serviceability and order location", point: [item.lat, item.lng], layer: "customerSites" })),
      ...assets.map((item) => ({ type: item.assetType, title: item.name, detail: `${item.capacityUsed}/${item.capacityTotal} ${item.capacityUnit} used · ${item.status}`, point: [item.lat, item.lng], layer: "assets" })),
    ].find((item) => `${item.title} ${item.detail}`.toLowerCase().includes(query));

    if (pointFeature) {
      setLayerVisibility((current) => ({ ...current, [pointFeature.layer]: true }));
      map.setView(pointFeature.point, 15);
      setSelectedFeature(pointFeature);
      setGisMessage(`Located ${pointFeature.title}.`);
      return;
    }

    const gisFeature = [
      ...(gisLayers.fiberRoutes?.features || []).map((feature) => ({ feature, type: "Fiber route", layer: "routes" })),
      ...(gisLayers.coverageZones?.features || []).map((feature) => ({ feature, type: "Coverage zone", layer: "coverage" })),
    ].find(({ feature }) => {
      const properties = feature.properties || {};
      return Object.values(properties).some((value) => String(value).toLowerCase().includes(query));
    });

    if (gisFeature) {
      const properties = gisFeature.feature.properties || {};
      const bounds = L.geoJSON(gisFeature.feature).getBounds();
      setLayerVisibility((current) => ({ ...current, [gisFeature.layer]: true }));
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [65, 65] });
      setSelectedFeature({ type: gisFeature.type, title: propertyValue(properties, "name", "Unnamed feature"), detail: `${propertyValue(properties, "id", "No ID")} · ${propertyValue(properties, "status", "Status not supplied")}` });
      setGisMessage(`Located ${propertyValue(properties, "name", "GIS feature")}.`);
      return;
    }

    setGisMessage(`No network feature matches "${mapQuery.trim()}".`);
  }

  function renderRouteControls() {
    return (
      <div className="tab-content">
        <div className="hint">
          Select an exchange/POP and a customer site to estimate fiber run
          length, spool count and recommend an available switch port.
        </div>
        <div className="hint" style={{ marginTop: 4, opacity: 0.6, fontSize: 12 }}>
          Drag waypoints to adjust the route. Click the line to add a bend point. Double-click a waypoint to remove it.
        </div>
        <form className="map-search-row" onSubmit={handleMapSearch}>
          <input value={mapQuery} onChange={(event) => setMapQuery(event.target.value)} placeholder="Find route, POP, site, or asset" aria-label="Find a network feature" />
          <button type="submit">Locate</button>
        </form>
        <div className="field">
          <label>From &mdash; Exchange / POP</label>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
            {pops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>To &mdash; Customer Site</label>
          <select value={toId} onChange={(e) => setToId(e.target.value)}>
            {customerSites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button className="estimate-btn" onClick={handleEstimate}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M3 10h3l2-6 4 12 2-6h3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Estimate route
        </button>
        <div className={`result-card${result ? " show" : ""}`}>
          <div className="result-title">ROUTE ESTIMATE</div>
          <div className="result-metric">
            <span className="m-label">Straight-line distance</span>
            <span className="m-val">{result ? fmtDist(result.straight) : "&mdash;"}</span>
          </div>
          <div className="result-metric">
            <span className="m-label">Est. routed cable length</span>
            <span className="m-val">{result ? fmtDist(result.routed) : "&mdash;"}</span>
          </div>
          <div className="result-metric">
            <span className="m-label">Fiber spools needed (500m)</span>
            <span className="m-val">{result ? `${result.spools} spool${result.spools > 1 ? "s" : ""}` : "&mdash;"}</span>
          </div>
          <div className="result-metric">
            <span className="m-label">Est. install time</span>
            <span className="m-val">{result ? `~${result.hours} hrs, 2-person crew` : "&mdash;"}</span>
          </div>
          <div className="port-suggest">
            <div className="ps-label">Recommended port assignment</div>
            <div className="ps-val">{result ? result.port : "&mdash;"}</div>
            {result && (
              <button
                className="ps-ask"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onPortAnalyze?.(result.port);
                }}
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 13, height: 13 }}>
                  <circle cx="10" cy="10" r="8" />
                  <path d="M10 7v4M10 14v.01" strokeLinecap="round" />
                </svg>
                Ask AI about this port
              </button>
            )}
          </div>
        </div>
        <div className="map-layer-panel">
          <div className="map-layer-head"><span>GIS LAYERS</span><small>{gisLayers.error ? "LOAD ERROR" : gisLayers.source}</small></div>
          <label><input type="checkbox" checked={layerVisibility.coverage} onChange={() => toggleLayer("coverage")} /><i className="coverage"></i>Service coverage</label>
          <label><input type="checkbox" checked={layerVisibility.routes} onChange={() => toggleLayer("routes")} /><i className="fiber"></i>Fiber routes</label>
          <label><input type="checkbox" checked={layerVisibility.pops} onChange={() => toggleLayer("pops")} /><i className="pop"></i>POPs and exchanges</label>
          <label><input type="checkbox" checked={layerVisibility.customerSites} onChange={() => toggleLayer("customerSites")} /><i className="customer"></i>Customer sites</label>
          <label><input type="checkbox" checked={layerVisibility.assets} onChange={() => toggleLayer("assets")} /><i className="asset"></i>Leasable assets</label>
          <label><input type="checkbox" checked={layerVisibility.liveQgis} onChange={() => toggleLayer("liveQgis")} /><i className="fiber" style={{ background: "#3468C0" }}></i>Live QGIS Server (WMS)</label>
        </div>
        {gisLayers.error && <p className="map-gis-error">Add valid QGIS GeoJSON files to `public/gis/` to load routes and coverage.</p>}
        <div className="map-import-panel">
          <div className="map-layer-head"><span>QGIS GEOJSON IMPORT</span><small>SAVES TO SERVER</small></div>
          <select value={importType} onChange={(event) => setImportType(event.target.value)} aria-label="GIS layer import type"><option value="fiberRoutes">Fiber routes</option><option value="coverageZones">Coverage zones</option></select>
          <label className="map-file-input"><input type="file" accept=".geojson,application/geo+json,application/json" onChange={handleGisImport} />Choose GeoJSON export</label>
          <button type="button" className="map-reset-gis" onClick={() => loadSampleGisLayers(true)}>Restore sample layers</button>
        </div>
        {gisMessage && <p className="map-gis-message">{gisMessage}</p>}
        {selectedFeature && <div className="map-feature-card"><span>{selectedFeature.type}</span><strong>{selectedFeature.title}</strong><p>{selectedFeature.detail}</p></div>}
      </div>
    );
  }

  return (
    <section className={`view${active ? " active" : ""} view-map`}>
      {!controlsOpen && (
        <button className="map-toggle" onClick={() => setControlsOpen(true)} title="Show controls">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M6 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div className={`map-controls${controlsOpen ? "" : " collapsed"}`}>
        <div className="mc-head">
          <h2>Network Map</h2>
          <button className="mc-close" onClick={() => setControlsOpen(false)} title="Hide controls">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {renderRouteControls()}
      </div>
      <div className="map-legend" aria-label="Network map legend"><span><i className="fiber"></i>Fiber route</span><span><i className="coverage"></i>Coverage</span><span><i className="pop"></i>POP</span><span><i className="asset"></i>Asset</span></div>
      <div ref={mapRef} id="map"></div>
    </section>
  );
}

export default NetworkMap;
