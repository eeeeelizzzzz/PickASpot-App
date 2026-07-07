import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// leaflet-draw expects global L
if (typeof window !== 'undefined') window.L = L;

import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { geocodeAddress, restaurantGeocodeQuery } from './drive-time.js';

const OKC_CENTER = [35.47, -97.52];
const DEFAULT_ZOOM = 10;

let map = null;
let markersLayer = null;
let drawnItems = null;
let drawControl = null;
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
    const box = L.latLngBounds(
      [mapFilter.south, mapFilter.west],
      [mapFilter.north, mapFilter.east],
    );
    if (box.isValid()) map.fitBounds(box.pad(0.12));
    return;
  }
  const withCoords = restaurants.filter(r => r.lat != null && r.lng != null);
  if (withCoords.length === 0) return;
  const bounds = L.latLngBounds(withCoords.map(r => [r.lat, r.lng]));
  if (bounds.isValid()) map.fitBounds(bounds.pad(0.12));
}

function restoreDrawnRectangle(mapFilter) {
  if (!drawnItems || !mapFilter) return;
  const box = L.latLngBounds(
    [mapFilter.south, mapFilter.west],
    [mapFilter.north, mapFilter.east],
  );
  if (!box.isValid()) return;
  drawnItems.clearLayers();
  drawnItems.addLayer(L.rectangle(box, {
    color: '#007AFF',
    weight: 2,
    fillOpacity: 0.12,
  }));
}

/** After the user draws or clears a filter box — no geocode, no zoom-to-all-pins. */
export function updateMapFilter(restaurants, mapFilter) {
  if (!map) return;
  refreshMarkers(restaurants, mapFilter);
  if (mapFilter) {
    restoreDrawnRectangle(mapFilter);
    fitMapView(restaurants, mapFilter);
  } else {
    drawnItems?.clearLayers();
  }
}

export function clearMapArea() {
  if (!drawnItems) return;
  drawnItems.clearLayers();
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

  drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polygon: false,
      circle: false,
      circlemarker: false,
      marker: false,
      polyline: false,
      rectangle: {
        shapeOptions: {
          color: '#007AFF',
          weight: 2,
          fillOpacity: 0.12,
        },
      },
    },
    edit: {
      featureGroup: drawnItems,
      edit: false,
      remove: true,
    },
  });
  map.addControl(drawControl);

  await invalidateMapSize();

  map.on(L.Draw.Event.CREATED, (e) => {
    if (e.layerType !== 'rectangle') return;
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    const bounds = boundsFromLeaflet(e.layer.getBounds());
    callbacks?.onBoundsChange?.(bounds);
    refreshMarkers(opts.getRestaurants?.() || [], bounds);
  });

  map.on(L.Draw.Event.DELETED, () => {
    callbacks?.onBoundsChange?.(null);
    refreshMarkers(opts.getRestaurants?.() || [], null);
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

  refreshMarkers(restaurants, mapFilter);

  if (mapFilter) restoreDrawnRectangle(mapFilter);
  if (fitView) fitMapView(restaurants, mapFilter);

  return { geocoded };
}
