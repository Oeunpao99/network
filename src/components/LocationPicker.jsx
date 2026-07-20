import { useEffect, useRef } from "react";
import L from "leaflet";

const DEFAULT_CENTER = [11.575, 104.918];

const selectedLocationIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;background:#00B39B;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);transform:rotate(-45deg)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 16],
});

function validCoordinate(value) {
  const coordinate = Number(value);
  return value !== "" && Number.isFinite(coordinate) ? coordinate : null;
}

function LocationPicker({ latitude, longitude, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const latitudeValue = validCoordinate(latitude);
    const longitudeValue = validCoordinate(longitude);
    const center = latitudeValue !== null && longitudeValue !== null
      ? [latitudeValue, longitudeValue]
      : DEFAULT_CENTER;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false }).setView(center, 12.5);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);
    map.on("click", ({ latlng }) => {
      onSelectRef.current({
        lat: latlng.lat.toFixed(6),
        lng: latlng.lng.toFixed(6),
      });
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const latitudeValue = validCoordinate(latitude);
    const longitudeValue = validCoordinate(longitude);
    const map = mapRef.current;
    if (!map || latitudeValue === null || longitudeValue === null) return;

    const location = [latitudeValue, longitudeValue];
    if (markerRef.current) {
      markerRef.current.setLatLng(location);
    } else {
      markerRef.current = L.marker(location, { icon: selectedLocationIcon }).addTo(map);
    }
    map.setView(location, Math.max(map.getZoom(), 14));
  }, [latitude, longitude]);

  return (
    <div className="location-picker">
      <p>Click a location on the map to set the latitude and longitude.</p>
      <div ref={containerRef} className="location-picker-map" />
      <div className="location-picker-value">
        {latitude !== "" && longitude !== "" ? `${latitude}, ${longitude}` : "No location selected"}
      </div>
    </div>
  );
}

export default LocationPicker;
