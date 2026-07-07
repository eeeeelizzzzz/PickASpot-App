import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// leaflet-draw expects global L
if (typeof window !== 'undefined') window.L = L;

import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { geocodeAddress, restaurantGeocodeQuery } from './drive-time.js';

const OKC_CENTER = [35.47, -97.52];
const DEFAULT_ZOOM = 10;

const FILTER_STYLE = {
  color: '#007AFF',
  weight: 2,
  fillOpacity: 0.12,
};

let map = null;
let markersLayer = null;
let drawnItems = null;
let filterLayer = null;
let callbacks = null;
let geocoding = false;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function inBounds(r, bounds) {
  if (!bounds || r.lat == null || r.lng == null) return true;
  return (
    r.lat >= bounds.south &&
    r.lat <= bounds.north &&
    r.lng >= bounds.west &&
    r.lng <= bounds.east
  );
}

function boundsFromLeaflet(latLngBounds) {
  return {
    south: latLngBounds.getSouth(),
    north: latLngBounds.getNorth(),
    west: latLngBounds.getWest(),
    east: latLngBounds.getEast(),
  };
}

function boundsToLeaflet(bounds) {
  return L.latLngBounds(
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  );
}

function boundsEqual(a, b) {
  if (!a || !b) return false;
  return (
    Math.abs(a.south - b.south) < 1e-8 &&
    Math.abs(a.north - b.north) < 1e-8 &&
    Math.abs(a.west - b.west) < 1e-8 &&
    Math.abs(a.east - b.east) < 1e-8
  );
}

function getRestaurants() {
  return callbacks?.getRestaurants?.() || [];
}

function enableFilterEdit(layer) {
  if (layer?.editing) layer.editing.enable();
}

function emitFilterChange() {
  const bounds = filterLayer ? boundsFromLeaflet(filterLayer.getBounds()) : null;
  callbacks?.onBoundsChange?.(bounds);
  refreshMarkers(getRestaurants(), bounds);
}

function defaultBoundsFromView() {
  const view = map.getBounds();
  const latSpan = view.getNorth() - view.getSouth();
  const lngSpan = view.getEast() - view.getWest();
  const padLat = latSpan * 0.2;
  const padLng = lngSpan * 0.2;
  return {
    south: view.getSouth() + padLat,
    north: view.getNorth() - padLat,
    west: view.getWest() + padLng,
    east: view.getEast() - padLng,
  };
}

function setFilterLayer(mapFilter) {
  if (!drawnItems || !map) return null;

  if (!mapFilter) {
    if (filterLayer?.editing) filterLayer.editing.disable();
    drawnItems.clearLayers();
    filterLayer = null;
    return null;
  }

  const box = boundsToLeaflet(mapFilter);
  if (!box.isValid()) return null;

  if (filterLayer && drawnItems.hasLayer(filterLayer) && boundsEqual(mapFilter, boundsFromLeaflet(filterLayer.getBounds()))) {
    enableFilterEdit(filterLayer);
    return filterLayer;
  }

  if (filterLayer?.editing) filterLayer.editing.disable();
  drawnItems.clearLayers();
  filterLayer = L.rectangle(box, FILTER_STYLE);
  drawnItems.addLayer(filterLayer);
  enableFilterEdit(filterLayer);
  return filterLayer;
}

async function ensureRestaurantCoords(restaurants, geoCache, onProgress) {
  if (geocoding) return;
  geocoding = true;
  try {
    let i = 0;
    for (const r of restaurants) {
      if (r.lat != null && r.lng != null) continue;
      const query = restaurantGeocodeQuery(r);
      const geo = await geocodeAddress(query, geoCache);
      await delay(200);
      if (geo) {
        r.lat = geo.lat;
        r.lng = geo.lon;
      }
      i++;
      onProgress?.(i, restaurants.length);
    }
  } finally {
    geocoding = false;
  }
}

function refreshMarkers(restaurants, mapFilter) {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();

  restaurants.forEach(r => {
    if (r.lat == null || r.lng == null) return;
    const selected = inBounds(r, mapFilter);
    const marker = L.circleMarker([r.lat, r.lng], {
      radius: selected || !mapFilter ? 8 : 5,
      color: selected || !mapFilter ? '#007AFF' : '#C7C7CC',
      fillColor: selected || !mapFilter ? '#007AFF' : '#E5E5EA',
      fillOpacity: selected || !mapFilter ? 0.9 : 0.5,
      weight: 2,
    });
    const dist = r.driveTimeMin != null ? ` · ${r.driveTimeMin} min` : '';
    marker.bindPopup(
      `<strong>${escapeHtml(r.name)}</strong><br>${escapeHtml(r.location)}${escapeHtml(dist)}`
    );
    marker.on('click', () => callbacks?.onMarkerClick?.(r.id));
    markersLayer.addLayer(marker);
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isMapReady() {
  return !!map;
}

export function invalidateMapSize() {
  if (!map) return Promise.resolve();
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
      requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
        setTimeout(resolve, 0);
      });
    });
  });
}

function fitMapView(restaurants, mapFilter) {
  if (!map) return;
  if (mapFilter) {
    const box = boundsToLeaflet(mapFilter);
    if (box.isValid()) map.fitBounds(box.pad(0.12));
    return;
  }
  const withCoords = restaurants.filter(r => r.lat != null && r.lng != null);
  if (withCoords.length === 0) return;
  const bounds = L.latLngBounds(withCoords.map(r => [r.lat, r.lng]));
  if (bounds.isValid()) map.fitBounds(bounds.pad(0.12));
}

/** Place a default filter box on the current map view and enable resize handles. */
export function createDefaultAreaFilter() {
  if (!map) return null;
  const bounds = defaultBoundsFromView();
  setFilterLayer(bounds);
  emitFilterChange();
  return bounds;
}

/** Refresh markers and optionally recreate the filter box (e.g. after sync). */
export function updateMapFilter(restaurants, mapFilter, { fitView = false } = {}) {
  if (!map) return;
  if (mapFilter) {
    setFilterLayer(mapFilter);
    refreshMarkers(restaurants, mapFilter);
    if (fitView) fitMapView(restaurants, mapFilter);
  } else {
    setFilterLayer(null);
    refreshMarkers(restaurants, null);
  }
}

export function clearMapArea() {
  setFilterLayer(null);
}

export async function mountMapView(containerEl, opts) {
  callbacks = opts;
  if (map) {
    invalidateMapSize();
    return;
  }

  map = L.map(containerEl, {
    center: OKC_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  drawnItems = new L.FeatureGroup().addTo(map);

  await invalidateMapSize();

  [L.Draw.Event.EDITVERTEX, L.Draw.Event.EDITMOVE, L.Draw.Event.EDITED].forEach(evt => {
    map.on(evt, () => emitFilterChange());
  });
}

export async function syncMapView(restaurants, mapFilter, geoCache, onStatus, options = {}) {
  if (!map) return { geocoded: 0 };
  const { geocode = true, fitView = true } = options;

  let geocoded = 0;
  if (geocode) {
    onStatus?.('Finding locations…');
    const before = restaurants.filter(r => r.lat != null).length;
    await ensureRestaurantCoords(restaurants, geoCache, (cur, total) => {
      onStatus?.(`Mapping ${cur}/${total}…`);
    });
    const after = restaurants.filter(r => r.lat != null).length;
    geocoded = after - before;
  }

  if (mapFilter) setFilterLayer(mapFilter);
  refreshMarkers(restaurants, mapFilter);
  if (fitView) fitMapView(restaurants, mapFilter);

  return { geocoded };
}
