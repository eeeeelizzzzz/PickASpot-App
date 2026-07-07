// Drive-time helpers: geocode via Photon, route via OSRM public API.

export const DRIVE_SHORT_MAX = 35;
export const DRIVE_LONGER_MAX = 65;

const NORMAN_BBOX = { south: 35.18, north: 35.29, west: -97.52, east: -97.37 };

export function isInNorman(lat, lon) {
  return (
    lat >= NORMAN_BBOX.south &&
    lat <= NORMAN_BBOX.north &&
    lon >= NORMAN_BBOX.west &&
    lon <= NORMAN_BBOX.east
  );
}

export function bucketFromDriveMinutes(minutes) {
  if (minutes < DRIVE_SHORT_MAX) return 'Short Drive';
  if (minutes <= DRIVE_LONGER_MAX) return 'Longer Drive';
  return 'Destination';
}

export function assignDistanceLabel({ lat, lon, driveTimeMin, location }) {
  if (lat != null && lon != null && isInNorman(lat, lon)) return 'In-town';
  if (location === 'Norman') return 'In-town';
  if (driveTimeMin == null || Number.isNaN(driveTimeMin)) return '';
  return bucketFromDriveMinutes(driveTimeMin);
}

export function restaurantGeocodeQuery(r) {
  if (r.address && r.address.trim()) return r.address.trim();
  return `${r.name}, ${r.location}, Oklahoma`;
}

export async function geocodeAddress(query, cache) {
  const key = query.trim().toLowerCase();
  if (!key) return null;
  if (cache[key]) return cache[key];

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  const [lon, lat] = feature.geometry.coordinates;
  const result = {
    lat,
    lon,
    city: (feature.properties?.city || '').toLowerCase(),
  };
  cache[key] = result;
  return result;
}

export async function getDriveTimeMinutes(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) return null;
  return Math.round(data.routes[0].duration / 60);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function recalculateRestaurantDistances(restaurants, homeAddress, geoCache, onProgress) {
  if (!homeAddress || !homeAddress.trim()) {
    return { updated: 0, skipped: restaurants.length, error: 'no_home' };
  }

  const home = await geocodeAddress(homeAddress.trim(), geoCache);
  if (!home) {
    return { updated: 0, skipped: restaurants.length, error: 'home_geocode' };
  }

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i];
    onProgress?.(i + 1, restaurants.length, r.name);

    const query = restaurantGeocodeQuery(r);
    const coords = await geocodeAddress(query, geoCache);
    await delay(250);

    if (!coords) {
      skipped++;
      continue;
    }

    let driveTimeMin = null;
    if (!isInNorman(coords.lat, coords.lon) && r.location !== 'Norman') {
      driveTimeMin = await getDriveTimeMinutes(home, coords);
      await delay(200);
    }

    r.driveTimeMin = driveTimeMin;
    r.distance = assignDistanceLabel({
      lat: coords.lat,
      lon: coords.lon,
      driveTimeMin,
      location: r.location,
    });
    updated++;
  }

  return { updated, skipped, error: null };
}
