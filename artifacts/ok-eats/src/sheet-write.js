const SHEET_WRITE_URL_KEY = 'ok_eats_sheet_write_url';
const SHEET_WRITE_SECRET_KEY = 'ok_eats_sheet_write_secret';

export function getSheetWriteUrl() {
  return localStorage.getItem(SHEET_WRITE_URL_KEY) || '';
}

export function getSheetWriteSecret() {
  return localStorage.getItem(SHEET_WRITE_SECRET_KEY) || '';
}

export function canSheetWrite() {
  return !!(getSheetWriteUrl() && getSheetWriteSecret());
}

export function saveSheetWriteConfig(url, secret) {
  localStorage.setItem(SHEET_WRITE_URL_KEY, url.trim());
  localStorage.setItem(SHEET_WRITE_SECRET_KEY, secret.trim());
}

function restaurantPayload(r) {
  return {
    id: r.id,
    name: r.name,
    location: r.location,
    tier: r.tier,
    tags: r.tags || [],
    reasons: r.reasons || [],
    address: r.address || '',
    distance: r.distance || '',
    driveTimeMin: r.driveTimeMin ?? '',
    dateSaved: r.dateSaved || '',
    lastVisited: r.lastVisited || '',
    ratings: r.ratings || null,
    notes: r.notes || '',
  };
}

async function postToSheet(action, data) {
  const url = getSheetWriteUrl();
  const secret = getSheetWriteSecret();
  if (!url || !secret) return { skipped: true };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, secret, ...data }),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return { error: 'Invalid response from sheet' };
    }
    if (!res.ok || json.error) {
      return { error: json.error || `HTTP ${res.status}` };
    }
    return { ok: true, ...json };
  } catch (e) {
    return { error: e.message || 'Network error' };
  }
}

export async function pushRestaurantToSheet(r) {
  return postToSheet('upsert', { restaurant: restaurantPayload(r) });
}

export async function deleteRestaurantFromSheet(id) {
  return postToSheet('delete', { id });
}

export async function pushAllRestaurantsToSheet(restaurants) {
  return postToSheet('upsertBatch', {
    restaurants: restaurants.map(restaurantPayload),
  });
}
