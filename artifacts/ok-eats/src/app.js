// ─── Data & Constants ────────────────────────────────────────────────────────

import {
  recalculateRestaurantDistances,
  DRIVE_SHORT_MAX,
  DRIVE_LONGER_MAX,
  bucketFromDriveMinutes,
  restaurantGeocodeQuery,
} from './drive-time.js';
import {
  mountMapView,
  syncMapView,
  invalidateMapSize,
  clearMapArea,
  isMapReady,
} from './map-view.js';
import {
  canSheetWrite,
  getSheetWriteUrl,
  getSheetWriteSecret,
  saveSheetWriteConfig,
  pushRestaurantToSheet,
  deleteRestaurantFromSheet,
} from './sheet-write.js';

const APP_NAME = 'Pick A Spot';
const APP_TAGLINE = 'Where do you wanna eat?';

const STORAGE_KEY       = 'pick_a_spot_restaurants_v2';
const SHEET_URL_KEY     = 'pick_a_spot_sheet_url';
const SHEET_SYNC_KEY    = 'pick_a_spot_sheet_last_sync';
const HOME_ADDRESS_KEY  = 'pick_a_spot_home_address';
const GEO_CACHE_KEY     = 'pick_a_spot_geo_cache';
const USE_API        = import.meta.env.VITE_USE_API === 'true';
const API_BASE       = import.meta.env.VITE_API_BASE || '/api/restaurants';
const GITHUB_REPO_URL = import.meta.env.VITE_GITHUB_REPO_URL || 'https://github.com/eeeeelizzzzz/PickASpot-App';
const AUTHOR_URL = 'https://eeeeelizzzzz.github.io/';
const EATING_OKC_URL = 'https://eatingokc.com/';
const GREG_HORTON_YOUTUBE_URL = 'https://www.youtube.com/watch?v=2fJRrb5pn9s';

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function apiCall(path, opts = {}) {
  if (!USE_API) return null;
  try {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('API error:', e);
    return null;
  }
}

function apiSave(r) {
  if (USE_API) return apiCall(`${API_BASE}/${r.id}`, { method: 'PUT', body: JSON.stringify(r) });
  if (canSheetWrite()) {
    pushRestaurantToSheet(r).then((result) => {
      if (result.error) showToast(`Sheet save failed: ${result.error}`);
    });
  }
  return Promise.resolve(null);
}

function apiCreate(r) {
  if (USE_API) return apiCall(API_BASE, { method: 'POST', body: JSON.stringify(r) });
  if (canSheetWrite()) {
    pushRestaurantToSheet(r).then((result) => {
      if (result.error) showToast(`Sheet save failed: ${result.error}`);
      else if (result.ok) showToast('Saved to sheet ✓');
    });
  }
  return Promise.resolve(null);
}

function apiRemove(id) {
  if (USE_API) return apiCall(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (canSheetWrite()) {
    deleteRestaurantFromSheet(id).then((result) => {
      if (result.error) showToast(`Sheet delete failed: ${result.error}`);
    });
  }
  return Promise.resolve(null);
}

function apiBulk(arr) {
  if (!USE_API) return Promise.resolve(null);
  return apiCall(`${API_BASE}/bulk`, { method: 'POST', body: JSON.stringify(arr) });
}

const TIERS = [
  '1: Delivery / Couch Meal',
  '2: Casual / Takeout',
  '3: Elevated / Sit-Down',
  '5: Destination / Special Occasion',
];

const LOCATIONS = ['Edmond', 'Moore', 'Norman', 'OKC - City', 'OKC - Outer', 'Other'];

const DISTANCE = ['In-town', 'Short Drive', 'Longer Drive', 'Destination'];

const REASONS = [
  'Acclaim / Awards', 'Classic / Staple', 'EatingOKC', 'Favorite',
  'Media / Online', 'New / Updated', 'Personal Recommendation',
];

const ALL_TAGS = [
  'Asian', 'Bakery / Dessert', 'Bar Food', 'BBQ', 'Breakfast / Brunch',
  'Burgers', 'Counter Service', 'Drive-thru', 'Everyday Casual',
  'Fine Dining', 'French', 'Fusion', 'Gluten Free Options',
  'Good for Groups', 'Great Cocktails', 'Italian', 'Large Beer List',
  'Large Wine Selection', 'Latin / Mexican', 'Mediterranean',
  'Middle Eastern / Indian', 'New American', 'No-Frills', 'Noodles',
  'Patio / Outdoor', 'Pizza', 'Reservations Required', 'Sandwiches',
  'Seafood', 'Southern / Comfort Food', 'Steakhouse', 'Sushi',
  'Takes Reservations', 'Upscale Casual', 'Vegetarian Friendly',
];

const TIER_COLORS = {
  '1: Delivery / Couch Meal':          { bg: '#E8F5E9', text: '#1B5E20', dot: '#34C759' },
  '2: Casual / Takeout':               { bg: '#E3F2FD', text: '#0D47A1', dot: '#007AFF' },
  '3: Elevated / Sit-Down':            { bg: '#F3E5F5', text: '#4A148C', dot: '#AF52DE' },
  '5: Destination / Special Occasion': { bg: '#FFF3E0', text: '#E65100', dot: '#FF9500' },
};

const TAG_COLORS = [
  { bg: '#FFF3E0', text: '#E65100' },
  { bg: '#E3F2FD', text: '#0D47A1' },
  { bg: '#F3E5F5', text: '#4A148C' },
  { bg: '#E8F5E9', text: '#1B5E20' },
  { bg: '#FCE4EC', text: '#880E4F' },
  { bg: '#E0F7FA', text: '#006064' },
  { bg: '#FFF8E1', text: '#F57F17' },
  { bg: '#EDE7F6', text: '#311B92' },
];

function tagColor(tag) {
  const idx = ALL_TAGS.indexOf(tag);
  return TAG_COLORS[Math.abs(idx) % TAG_COLORS.length] || TAG_COLORS[0];
}

// ─── Default Seed Data ───────────────────────────────────────────────────────
// No seed data — the couple re-enters their list fresh via the Google Sheet sync.

const SEED_RESTAURANTS = [];

// ─── State ────────────────────────────────────────────────────────────────────

let state = {
  tab: 'discover',
  restaurants: [],
  filters: {
    locations: [],
    tags: [],
    distance: [],
    reasons: [],
  },
  results: null,
  top10Pool: null,
  listSearch: '',
  expandedFilters: false,
  mapFilter: null,
};

function loadRestaurantsLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(({ bestSeasons: _s, ...r }) => r);
      }
    }
  } catch {}
  return JSON.parse(JSON.stringify(SEED_RESTAURANTS));
}

function saveRestaurants() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.restaurants));
}

function getHomeAddress() {
  return localStorage.getItem(HOME_ADDRESS_KEY) || '';
}

function loadGeoCache() {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveGeoCache(cache) {
  localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
}

function applyGeoCacheToRestaurants() {
  const cache = loadGeoCache();
  state.restaurants.forEach(r => {
    if (r.lat != null && r.lng != null) return;
    const key = restaurantGeocodeQuery(r).trim().toLowerCase();
    const geo = cache[key];
    if (geo) {
      r.lat = geo.lat;
      r.lng = geo.lon;
    }
  });
}

function formatDistanceLabel(r) {
  if (!r.distance && r.driveTimeMin == null) return '';
  if (r.distance === 'In-town') return 'In-town';
  if (r.driveTimeMin != null) return `${r.distance} · ${r.driveTimeMin} min`;
  return r.distance || '';
}

async function recalculateDistances() {
  const home = getHomeAddress();
  if (!home) {
    showToast('Set your home address in Settings first');
    return { error: 'no_home' };
  }
  if (state.restaurants.length === 0) return { updated: 0 };

  showToast('Calculating drive times…');
  const geoCache = loadGeoCache();
  const result = await recalculateRestaurantDistances(
    state.restaurants,
    home,
    geoCache,
    (current, total, name) => {
      if (current === 1 || current === total || current % 5 === 0) {
        showToast(`Drive times: ${current}/${total}…`);
      }
    },
  );
  saveGeoCache(geoCache);
  saveRestaurants();

  if (result.error === 'home_geocode') {
    showToast('Could not find your home address — check spelling');
    return result;
  }
  showToast(`Updated drive times for ${result.updated} restaurants`);
  return result;
}

// ─── Scoring Engine ───────────────────────────────────────────────────────────

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.round((d2 - d1) / 86400000);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function scoreRestaurant(r) {
  const t = today();
  let score = 0;
  // +5 never visited
  if (!r.lastVisited) score += 5;
  // +3 saved over 6 months
  if (daysBetween(r.dateSaved, t) > 180) score += 3;
  // +2 acclaimed / awards reason
  if ((r.reasons || []).includes('Acclaim / Awards')) score += 2;
  // +3 favorite reason
  if ((r.reasons || []).includes('Favorite')) score += 3;
  // -5 visited in last 90 days
  if (r.lastVisited && daysBetween(r.lastVisited, t) < 90) score -= 5;
  return score;
}

function isInMapBounds(r) {
  const b = state.mapFilter;
  if (!b || r.lat == null || r.lng == null) return !b;
  return (
    r.lat >= b.south && r.lat <= b.north &&
    r.lng >= b.west && r.lng <= b.east
  );
}

function countMapFilterMatches() {
  if (!state.mapFilter) return 0;
  return state.restaurants.filter(r => isInMapBounds(r)).length;
}

function applyMapFilter(pool) {
  if (!state.mapFilter) return pool;
  return pool.filter(r => r.lat != null && r.lng != null && isInMapBounds(r));
}

function findRecommendations() {
  const { locations, tags, distance, reasons } = state.filters;
  let pool = state.restaurants.slice();

  // Filter
  if (locations.length > 0) {
    pool = pool.filter(r => locations.includes(r.location));
  }
  if (distance.length > 0) {
    pool = pool.filter(r => distance.includes(r.distance));
  }
  if (tags.length > 0) {
    pool = pool.filter(r => tags.every(tag => r.tags.includes(tag)));
  }
  if (reasons.length > 0) {
    pool = pool.filter(r => reasons.every(reason => (r.reasons || []).includes(reason)));
  }
  pool = applyMapFilter(pool);

  // Score
  pool = pool.map(r => ({ ...r, _score: scoreRestaurant(r) }));

  // Sort descending
  pool.sort((a, b) => b._score - a._score);

  // Top 10 — store for Spin Again
  state.top10Pool = pool.slice(0, 10);

  return pickThreeFromPool();
}

function pickThreeFromPool() {
  const pool = state.top10Pool || [];
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function genId() {
  return 'r' + Date.now() + Math.random().toString(36).slice(2, 6);
}

function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeDate(dateStr) {
  if (!dateStr) return 'Never visited';
  const days = daysBetween(dateStr, today());
  if (days === 0) return 'Visited today';
  if (days === 1) return 'Visited yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}yr ago`;
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Render: Discover Tab ─────────────────────────────────────────────────────

function renderDiscover() {
  const { filters, results } = state;
  const el = document.getElementById('page-discover');

  const locationPills = LOCATIONS.map(loc => {
    const on = filters.locations.includes(loc);
    return `<button class="pill ${on ? 'pill-on' : 'pill-off'}" onclick="toggleLocation('${escHtml(loc)}')">${escHtml(loc)}</button>`;
  }).join('');

  const distancePills = DISTANCE.map(d => {
    const on = filters.distance.includes(d);
    return `<button class="pill ${on ? 'pill-on' : 'pill-off'}" onclick="toggleDistance('${escHtml(d)}')">${escHtml(d)}</button>`;
  }).join('');

  const tagPills = ALL_TAGS.map(tag => {
    const on = filters.tags.includes(tag);
    return `<button class="pill ${on ? 'pill-on' : 'pill-off'}" onclick="toggleTag('${escHtml(tag)}')">${escHtml(tag)}</button>`;
  }).join('');

  const reasonPills = REASONS.map(reason => {
    const on = filters.reasons.includes(reason);
    return `<button class="pill ${on ? 'pill-on' : 'pill-off'}" onclick="toggleReason('${escHtml(reason)}')">${escHtml(reason)}</button>`;
  }).join('');

  const activeCount = filters.locations.length + filters.tags.length + filters.distance.length + filters.reasons.length;
  const activeLabel = activeCount > 0 ? `<span style="background:#007AFF;color:white;border-radius:100px;padding:0 6px;font-size:11px;font-weight:700;margin-left:4px;">${activeCount}</span>` : '';
  const mapFilterBanner = state.mapFilter ? `
    <div style="margin:0 20px 12px;padding:12px 14px;background:#E3F2FD;border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
      <div style="font-size:13px;color:#0D47A1;line-height:1.4;">
        <strong>Map area</strong> — ${countMapFilterMatches()} places in box
      </div>
      <button onclick="clearMapAreaFilter()" style="background:white;color:#007AFF;border:none;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;flex-shrink:0;">Clear</button>
    </div>` : '';

  let resultsHtml = '';
  if (results) {
    if (results.length === 0) {
      resultsHtml = `
        <div style="padding:24px 20px;">
          <div class="ios-card" style="padding:32px 20px;text-align:center;">
            <div style="font-size:44px;margin-bottom:12px;">🤔</div>
            <div style="font-size:17px;font-weight:600;color:#000;margin-bottom:6px;">No matches found</div>
            <div style="font-size:14px;color:#8E8E93;line-height:1.5;">Try removing some filters to widen your search.</div>
          </div>
        </div>`;
    } else {
      const cards = results.map((r, i) => renderResultCard(r, i)).join('');
      const poolSize = (state.top10Pool || []).length;
      resultsHtml = `
        <div style="padding:0 20px 8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-top:4px;">
            <div style="font-size:13px;color:#8E8E93;font-weight:500;">3 picks from top ${poolSize}</div>
            <button onclick="handleSpinAgain()" style="display:flex;align-items:center;gap:5px;background:white;border:none;border-radius:10px;padding:7px 13px;font-size:13px;font-weight:600;color:#007AFF;font-family:inherit;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
              <span id="spin-icon" style="display:inline-block;font-size:14px;transition:transform 0.45s cubic-bezier(0.34,1.56,0.64,1);">🎲</span> Spin Again
            </button>
          </div>
          ${cards}
        </div>`;
    }
  }

  el.innerHTML = `
    <div style="padding:20px 20px 12px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
        <div>
          <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#000;line-height:1.1;">${APP_NAME}</div>
          <div style="font-size:14px;color:#8E8E93;margin-top:2px;font-weight:400;">${APP_TAGLINE}</div>
          ${getSheetUrl() ? `<div style="font-size:11px;color:#8E8E93;margin-top:4px;">Sheet last synced: ${lastSheetSync()}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
          <button onclick="syncFromSheet()" style="background:#007AFF;color:white;border:none;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px rgba(0,122,255,0.25);">Sync Now</button>
          <div style="font-size:13px;color:#007AFF;font-weight:500;cursor:pointer;" onclick="clearFilters()">Clear all</div>
        </div>
      </div>
    </div>

    ${mapFilterBanner}

    <div style="padding:0 20px 14px;">
      <div class="ios-card" style="padding:16px;">

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:12px;font-weight:700;color:#8E8E93;letter-spacing:0.6px;text-transform:uppercase;">Location ${activeLabel}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px;">
          ${locationPills}
        </div>

        <div style="font-size:12px;font-weight:700;color:#8E8E93;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:10px;">Distance</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px;">
          ${distancePills}
        </div>

        <div style="font-size:12px;font-weight:700;color:#8E8E93;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:10px;">Tags</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px;">
          ${tagPills}
        </div>

        <div style="font-size:12px;font-weight:700;color:#8E8E93;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:10px;">Reasons</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;">
          ${reasonPills}
        </div>
      </div>
    </div>

    <div style="padding:0 20px 24px;">
      <button class="find-btn" onclick="handleFindFood()">
        <span style="font-size:20px;">✨</span>
        Find Food
      </button>
    </div>

    ${resultsHtml}
  `;
}

function getPoolSize() {
  const { filters } = state;
  let pool = state.restaurants.slice();
  if (filters.locations.length > 0) pool = pool.filter(r => filters.locations.includes(r.location));
  if (filters.distance.length > 0) pool = pool.filter(r => filters.distance.includes(r.distance));
  if (filters.tags.length > 0) pool = pool.filter(r => filters.tags.every(tag => r.tags.includes(tag)));
  if (filters.reasons.length > 0) pool = pool.filter(r => filters.reasons.every(reason => (r.reasons || []).includes(reason)));
  pool = applyMapFilter(pool);
  return pool.length;
}

function renderResultCard(r, index) {
  const tierCfg = TIER_COLORS[r.tier] || { bg: '#F2F2F7', text: '#3C3C43', dot: '#8E8E93' };
  const tagBadges = r.tags.slice(0, 4).map(tag => {
    const c = tagColor(tag);
    return `<span class="badge-tag" style="background:${c.bg};color:${c.text};">${escHtml(tag)}</span>`;
  }).join('');
  const reasonBadges = (r.reasons || []).map(reason => {
    return reason === 'Favorite'
      ? `<span class="badge-tag" style="background:#FFF8E1;color:#B25D00;">⭐ Favorite</span>`
      : `<span class="badge-tag" style="background:#FFF8E1;color:#B25D00;">${escHtml(reason)}</span>`;
  }).join('');
  const visitedText = r.lastVisited ? relativeDate(r.lastVisited) : '✦ Never visited';
  const scoreColor = r._score >= 7 ? '#34C759' : r._score >= 4 ? '#007AFF' : r._score >= 0 ? '#FF9500' : '#FF3B30';
  const delayClass = ['', 'd1', 'd2'][index] || '';

  return `
    <div class="ios-card-lg slide-up ${delayClass}" style="margin-bottom:14px;">
      <div style="background:linear-gradient(135deg, ${tierCfg.bg} 0%, white 60%);padding:16px 16px 14px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:19px;font-weight:700;letter-spacing:-0.3px;color:#000;line-height:1.2;margin-bottom:3px;">${escHtml(r.name)}</div>
            <div style="font-size:13px;color:#8E8E93;font-weight:500;margin-bottom:8px;">📍 ${escHtml(r.location)}</div>
            <span style="display:inline-block;background:${tierCfg.bg};color:${tierCfg.text};padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700;letter-spacing:0.2px;">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${tierCfg.dot};margin-right:4px;vertical-align:middle;margin-bottom:1px;"></span>${escHtml(r.tier)}
            </span>
          </div>
          <div style="text-align:center;flex-shrink:0;">
            <div style="width:52px;height:52px;border-radius:50%;background:${scoreColor}18;border:2px solid ${scoreColor}30;display:flex;flex-direction:column;align-items:center;justify-content:center;">
              <div style="font-size:18px;font-weight:700;color:${scoreColor};line-height:1;">${r._score}</div>
              <div style="font-size:9px;color:${scoreColor};font-weight:600;letter-spacing:0.2px;line-height:1;margin-top:1px;">PTS</div>
            </div>
          </div>
        </div>
      </div>
      <div style="padding:12px 16px 14px;border-top:0.5px solid #F2F2F7;">
        <div style="font-size:12px;color:#8E8E93;font-weight:500;margin-bottom:8px;">${escHtml(formatDistanceLabel(r))}</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">
          ${reasonBadges}
          ${tagBadges}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:12px;color:#8E8E93;font-weight:500;">
            ${r.lastVisited ? '🗓️' : '✨'} ${visitedText}
          </div>
          <button onclick="markVisitedId('${escHtml(r.id)}')" style="background:#007AFF14;color:#007AFF;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;">Mark Visited</button>
        </div>
      </div>
    </div>`;
}

// ─── Render: History Tab ──────────────────────────────────────────────────────

function renderHistory() {
  const el = document.getElementById('page-history');

  const visited = state.restaurants
    .filter(r => r.lastVisited)
    .sort((a, b) => b.lastVisited.localeCompare(a.lastVisited));

  if (visited.length === 0) {
    el.innerHTML = `
      <div style="padding:20px 20px 12px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#000;margin-bottom:4px;">History</div>
          <div style="font-size:14px;color:#8E8E93;">Every place you've been</div>
        </div>
        <button onclick="openLogVisit()" style="background:#007AFF;color:white;border:none;border-radius:11px;padding:9px 15px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;white-space:nowrap;flex-shrink:0;margin-top:4px;box-shadow:0 3px 10px rgba(0,122,255,0.28);">+ Log Visit</button>
      </div>
      <div style="padding:40px 20px;text-align:center;">
        <div style="font-size:52px;margin-bottom:14px;">🍴</div>
        <div style="font-size:18px;font-weight:600;color:#000;margin-bottom:6px;">No visits yet</div>
        <div style="font-size:14px;color:#8E8E93;line-height:1.5;">Tap <strong>+ Log Visit</strong> to add a place<br/>you've already been to.</div>
      </div>`;
    return;
  }

  // Stats
  const totalVisits = visited.length;
  const uniqueLocations = new Set(visited.map(r => r.location)).size;
  const favoriteCount = visited.filter(r => (r.reasons || []).includes('Favorite')).length;

  // Group by month
  const groups = {};
  visited.forEach(r => {
    const d = new Date(r.lastVisited + 'T00:00:00');
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  let groupsHtml = '';
  for (const [month, items] of Object.entries(groups)) {
    const rows = items.map((r, idx) => {
      const tierCfg = TIER_COLORS[r.tier] || { bg: '#F2F2F7', text: '#3C3C43', dot: '#8E8E93' };
      const isFirst = idx === 0;
      return `
        <div class="list-row" onclick="openRestaurantDetail('${escHtml(r.id)}')" style="${!isFirst ? 'border-top:0.5px solid #F2F2F7;' : ''}">
          <div style="margin-right:12px;text-align:center;flex-shrink:0;width:32px;">
            <div style="font-size:12px;font-weight:700;color:#8E8E93;line-height:1;">${new Date(r.lastVisited + 'T00:00:00').toLocaleDateString('en-US', { month:'short' }).toUpperCase()}</div>
            <div style="font-size:19px;font-weight:700;color:#000;line-height:1.1;">${new Date(r.lastVisited + 'T00:00:00').getDate()}</div>
          </div>
          <div style="width:1px;background:#E5E5EA;align-self:stretch;margin-right:14px;flex-shrink:0;"></div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">
              <div style="font-size:15px;font-weight:600;color:#000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(r.name)}</div>
              ${(r.reasons || []).includes('Favorite') ? '<span style="color:#FFCC00;font-size:12px;flex-shrink:0;">★</span>' : ''}
            </div>
            <div style="font-size:12px;color:#8E8E93;">📍 ${escHtml(r.location)}</div>
            ${(r.ratings && (r.ratings.food || r.ratings.vibe || r.ratings.service)) ? `
            <div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap;">
              ${r.ratings.food    ? `<span style="font-size:11px;color:#8E8E93;" title="Food">🍴 ${'★'.repeat(r.ratings.food)}${'☆'.repeat(5-r.ratings.food)}</span>` : ''}
              ${r.ratings.vibe    ? `<span style="font-size:11px;color:#8E8E93;" title="Vibe">✨ ${'★'.repeat(r.ratings.vibe)}${'☆'.repeat(5-r.ratings.vibe)}</span>` : ''}
              ${r.ratings.service ? `<span style="font-size:11px;color:#8E8E93;" title="Service">🤝 ${'★'.repeat(r.ratings.service)}${'☆'.repeat(5-r.ratings.service)}</span>` : ''}
              ${r.ratings.cost    ? `<span style="font-size:11px;color:#8E8E93;">${escHtml(r.ratings.cost)}</span>` : ''}
            </div>` : ''}
            ${r.notes ? `<div style="font-size:11px;color:#AEAEB2;margin-top:3px;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">"${escHtml(r.notes)}"</div>` : ''}
          </div>
          <div style="margin-left:10px;flex-shrink:0;">
            <span style="background:${tierCfg.bg};color:${tierCfg.text};padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;white-space:nowrap;">
              <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${tierCfg.dot};margin-right:3px;vertical-align:middle;margin-bottom:1px;"></span>${escHtml(r.tier.replace('Tier 1 - ','T1 ').replace('Tier 2 - ','T2 ').replace('Tier 3 - ','T3 ').replace('The Fun Category','Fun'))}
            </span>
          </div>
        </div>`;
    }).join('');

    groupsHtml += `
      <div class="section-label">${escHtml(month)} <span style="color:#C7C7CC;font-weight:400;">(${items.length})</span></div>
      <div class="ios-card">${rows}</div>`;
  }

  el.innerHTML = `
    <div style="padding:20px 20px 12px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
      <div>
        <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#000;margin-bottom:4px;">History</div>
        <div style="font-size:14px;color:#8E8E93;">Every place you've been</div>
      </div>
      <button onclick="openLogVisit()" style="background:#007AFF;color:white;border:none;border-radius:11px;padding:9px 15px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;white-space:nowrap;flex-shrink:0;margin-top:4px;box-shadow:0 3px 10px rgba(0,122,255,0.28);">+ Log Visit</button>
    </div>

    <div style="padding:0 20px 16px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        <div class="ios-card" style="padding:14px 12px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#007AFF;letter-spacing:-0.5px;">${totalVisits}</div>
          <div style="font-size:11px;color:#8E8E93;font-weight:500;margin-top:2px;">Visits</div>
        </div>
        <div class="ios-card" style="padding:14px 12px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#34C759;letter-spacing:-0.5px;">${uniqueLocations}</div>
          <div style="font-size:11px;color:#8E8E93;font-weight:500;margin-top:2px;">Cities</div>
        </div>
        <div class="ios-card" style="padding:14px 12px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#FFCC00;letter-spacing:-0.5px;">${favoriteCount}</div>
          <div style="font-size:11px;color:#8E8E93;font-weight:500;margin-top:2px;">Favorites</div>
        </div>
      </div>
    </div>

    <div style="padding:0 20px 32px;">
      ${groupsHtml}
    </div>`;
}

// ─── Render: List Tab ─────────────────────────────────────────────────────────

function restaurantActionsHtml(opts = {}) {
  const sheetUrl = getSheetUrl();
  const sheetLinkBtn = opts.showSheetLink && sheetUrl ? `
      <button onclick="openGoogleSheet()" style="background:white;border:none;border-radius:12px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;width:100%;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.07);font-family:inherit;" ontouchstart="">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;">
          <span style="width:28px;height:28px;background:#34A853;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px;color:white;flex-shrink:0;">📊</span>
          <div style="text-align:left;min-width:0;">
            <div style="font-size:15px;font-weight:600;color:#000;">Open Google Sheet</div>
            <div style="font-size:12px;color:#8E8E93;">View or edit your source spreadsheet</div>
          </div>
        </div>
        <span style="color:#007AFF;font-size:16px;flex-shrink:0;margin-left:8px;">↗</span>
      </button>` : '';

  return `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button onclick="openAddRestaurant()" style="background:white;border:none;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;width:100%;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.07);font-family:inherit;" ontouchstart="">
        <span style="width:28px;height:28px;background:#007AFF;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:17px;color:white;flex-shrink:0;">+</span>
        <div style="text-align:left;">
          <div style="font-size:15px;font-weight:600;color:#000;">Add Restaurant</div>
          <div style="font-size:12px;color:#8E8E93;">Add a new spot to your list</div>
        </div>
      </button>
      ${sheetLinkBtn}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button onclick="exportData()" style="background:white;border:none;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:9px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.07);font-family:inherit;" ontouchstart="">
          <span style="width:26px;height:26px;background:#34C75920;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">⬆️</span>
          <div style="text-align:left;">
            <div style="font-size:14px;font-weight:600;color:#000;">Export</div>
            <div style="font-size:11px;color:#8E8E93;">Download JSON</div>
          </div>
        </button>
        <button onclick="importData()" style="background:white;border:none;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:9px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.07);font-family:inherit;" ontouchstart="">
          <span style="width:26px;height:26px;background:#FF950020;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">⬇️</span>
          <div style="text-align:left;">
            <div style="font-size:14px;font-weight:600;color:#000;">Import</div>
            <div style="font-size:11px;color:#8E8E93;">Load JSON</div>
          </div>
        </button>
        <button onclick="exportCSV()" style="background:white;border:none;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:9px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.07);font-family:inherit;" ontouchstart="">
          <span style="width:26px;height:26px;background:#34C75920;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">📊</span>
          <div style="text-align:left;">
            <div style="font-size:14px;font-weight:600;color:#000;">Export CSV</div>
            <div style="font-size:11px;color:#8E8E93;">Edit in Sheets</div>
          </div>
        </button>
        <button onclick="importCSV()" style="background:white;border:none;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:9px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.07);font-family:inherit;" ontouchstart="">
          <span style="width:26px;height:26px;background:#FF950020;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">📥</span>
          <div style="text-align:left;">
            <div style="font-size:14px;font-weight:600;color:#000;">Import CSV</div>
            <div style="font-size:11px;color:#8E8E93;">Load edited sheet</div>
          </div>
        </button>
      </div>
    </div>`;
}

function restaurantMatchesSearch(r, search) {
  if (!search) return true;
  const hay = [
    r.name,
    r.location,
    r.tier,
    r.address,
    r.distance,
    r.notes,
    ...(r.tags || []),
    ...(r.reasons || []),
  ].join(' ').toLowerCase();
  return hay.includes(search);
}

function renderList() {
  const el = document.getElementById('page-list');
  const search = state.listSearch.trim().toLowerCase();

  let filtered = state.restaurants.filter(r => restaurantMatchesSearch(r, search));

  // Group by tier
  const groups = {};
  TIERS.forEach(t => { groups[t] = []; });
  filtered.forEach(r => {
    if (groups[r.tier]) groups[r.tier].push(r);
    else groups[r.tier] = [r];
  });

  let groupsHtml = '';
  TIERS.forEach(tier => {
    const items = groups[tier] || [];
    if (items.length === 0) return;
    const tierCfg = TIER_COLORS[tier] || { bg: '#F2F2F7', text: '#3C3C43', dot: '#8E8E93' };
    const rows = items.map(r => {
      const visitedText = relativeDate(r.lastVisited);
      return `
        <div class="list-row" onclick="openRestaurantDetail('${escHtml(r.id)}')">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">
              <div style="font-size:15px;font-weight:600;color:#000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(r.name)}</div>
              ${(r.reasons || []).includes('Favorite') ? '<span style="color:#FFCC00;font-size:12px;flex-shrink:0;">★</span>' : ''}
            </div>
            <div style="font-size:12px;color:#8E8E93;">${escHtml(r.location)} · ${visitedText}${r.distance ? ` · ${escHtml(formatDistanceLabel(r))}` : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-left:10px;">
            <span style="background:${tierCfg.bg};width:8px;height:8px;border-radius:50%;flex-shrink:0;"></span>
            <span style="color:#C7C7CC;font-size:14px;">›</span>
          </div>
        </div>`;
    }).join('');

    groupsHtml += `
      <div class="section-label">${escHtml(tier)} <span style="color:#C7C7CC;font-weight:400;">(${items.length})</span></div>
      <div class="ios-card">${rows}</div>`;
  });

  if (!groupsHtml) {
    const total = state.restaurants.length;
    if (total === 0) {
      groupsHtml = `
        <div class="ios-card" style="padding:32px 20px;text-align:center;">
          <div style="font-size:40px;margin-bottom:10px;">🍽️</div>
          <div style="font-size:16px;font-weight:600;color:#000;margin-bottom:4px;">No restaurants yet</div>
          <div style="font-size:13px;color:#8E8E93;">Add one above, sync from Settings, or import a file.</div>
        </div>`;
    } else if (search) {
      groupsHtml = `
        <div class="ios-card" style="padding:32px 20px;text-align:center;">
          <div style="font-size:40px;margin-bottom:10px;">🔍</div>
          <div style="font-size:16px;font-weight:600;color:#000;margin-bottom:4px;">No matches</div>
          <div style="font-size:13px;color:#8E8E93;">Nothing matched "${escHtml(state.listSearch.trim())}". Try name, location, tags, or tier.</div>
        </div>`;
    } else {
      groupsHtml = `
        <div class="ios-card" style="padding:32px 20px;text-align:center;">
          <div style="font-size:40px;margin-bottom:10px;">🔍</div>
          <div style="font-size:16px;font-weight:600;color:#000;margin-bottom:4px;">No results</div>
          <div style="font-size:13px;color:#8E8E93;">Try a different search term.</div>
        </div>`;
    }
  }

  const searchMeta = search
    ? `<div style="font-size:12px;color:#8E8E93;margin-bottom:8px;">${filtered.length} of ${state.restaurants.length} shown</div>`
    : state.restaurants.length
      ? `<div style="font-size:12px;color:#8E8E93;margin-bottom:8px;">${state.restaurants.length} restaurant${state.restaurants.length === 1 ? '' : 's'}</div>`
      : '';

  el.innerHTML = `
    <div style="padding:20px 20px 12px;">
      <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#000;margin-bottom:12px;">List</div>
    </div>

    <div style="padding:0 20px 12px;">
      ${restaurantActionsHtml({ showSheetLink: true })}
    </div>

    <div style="padding:0 20px 8px;">
      <div class="search-wrap">
        <span style="color:#8E8E93;font-size:15px;">🔍</span>
        <input
          id="list-search"
          type="search"
          placeholder="Search name, location, tags, tier…"
          value="${escHtml(state.listSearch)}"
          oninput="handleListSearch(this.value)"
        />
        ${state.listSearch ? `<button onclick="handleListSearch('')" style="background:rgba(118,118,128,0.24);border:none;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;font-size:10px;color:#8E8E93;flex-shrink:0;">✕</button>` : ''}
      </div>
      ${searchMeta}
    </div>

    <div style="padding:0 20px 32px;">
      ${groupsHtml}
    </div>
  `;
}

// ─── Render: Settings Tab ───────────────────────────────────────────────────

function renderSettings() {
  const el = document.getElementById('page-settings');

  el.innerHTML = `
    <div style="padding:20px 20px 12px;">
      <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#000;margin-bottom:4px;">Settings</div>
      <div style="font-size:14px;color:#8E8E93;line-height:1.5;">Sync with Google Sheets, connect sheet saving, and import/export data.</div>
    </div>

    <div style="padding:0 20px 16px;display:flex;flex-direction:column;gap:12px;">
      <div class="ios-card" style="padding:14px 16px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:16px;">🔗</span>
          <div style="font-size:14px;font-weight:600;color:#000;">Sync from Google Sheet</div>
        </div>
        <div style="font-size:12px;color:#8E8E93;margin-bottom:10px;line-height:1.4;">
          Share a Sheet ("Anyone with the link can view"), paste its link below, and sync anytime to pull in edits.
        </div>
        <input id="sheet-url-input" class="ios-input" type="text" placeholder="Paste Google Sheet link…" value="${escHtml(getSheetUrl())}" style="margin-bottom:8px;" />
        <div style="display:flex;gap:8px;">
          <button onclick="saveSheetUrl()" style="flex:1;background:#F2F2F7;color:#000;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;">Save Link</button>
          <button onclick="syncFromSheet()" style="flex:1;background:#007AFF;color:white;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;">Sync Now</button>
        </div>
        ${getSheetUrl() ? `<div style="font-size:11px;color:#8E8E93;margin-top:8px;">Last synced: ${lastSheetSync()}</div>` : ''}
      </div>

      <div class="ios-card" style="padding:14px 16px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:16px;">⬆️</span>
          <div style="font-size:14px;font-weight:600;color:#000;">Save to Google Sheet</div>
        </div>
        <div style="font-size:12px;color:#8E8E93;margin-bottom:10px;line-height:1.4;">
          Push new restaurants and visit logs from Pick A Spot to your sheet. First deploy the spreadsheet's Apps Script as a Web app (How To), then paste that URL and <strong>Config!B2</strong> here.
        </div>
        <input id="sheet-write-url-input" class="ios-input" type="text" placeholder="Apps Script Web app URL (not your sheet link)…" value="${escHtml(getSheetWriteUrl())}" style="margin-bottom:8px;" />
        <input id="sheet-write-secret-input" class="ios-input" type="password" placeholder="Write secret from Config!B2…" value="${escHtml(getSheetWriteSecret())}" style="margin-bottom:8px;" />
        <button onclick="saveSheetWriteBack()" style="width:100%;background:#F2F2F7;color:#000;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;">
          Save Google Sheet connection
        </button>
        ${canSheetWrite() ? '<div style="font-size:11px;color:#34C759;margin-top:8px;">Connected — new visits and restaurants save to your sheet automatically</div>' : ''}
      </div>

      <div class="ios-card" style="padding:14px 16px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:16px;">🏠</span>
          <div style="font-size:14px;font-weight:600;color:#000;">Home address</div>
        </div>
        <div style="font-size:12px;color:#8E8E93;margin-bottom:10px;line-height:1.4;">
          Optional fallback if you don't use the sheet Apps Script. For drive times, use
          <strong>Pick A Spot → Update all drive times</strong> in Google Sheets instead.
        </div>
        <input id="home-address-input" class="ios-input" type="text" placeholder="e.g. 123 Main St, Norman, OK" value="${escHtml(getHomeAddress())}" style="margin-bottom:8px;" />
        <div style="display:flex;gap:8px;">
          <button onclick="saveHomeAddress()" style="flex:1;background:#F2F2F7;color:#000;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;">Save Home</button>
          <button onclick="updateDriveTimes()" style="flex:1;background:#007AFF;color:white;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;">Update Drive Times</button>
        </div>
      </div>

      ${restaurantActionsHtml()}

      <button onclick="switchTab('help'); setTimeout(() => { const el = document.getElementById('help-configuration'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50);"
        style="background:white;border:none;border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;width:100%;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.07);font-family:inherit;margin-top:4px;">
        <div style="text-align:left;">
          <div style="font-size:15px;font-weight:600;color:#000;">How to configure your setup</div>
          <div style="font-size:12px;color:#8E8E93;">Google Sheet sync &amp; save settings</div>
        </div>
        <span style="color:#007AFF;font-size:18px;">›</span>
      </button>
    </div>

    <div style="padding-bottom:32px;"></div>
  `;
}

function sourceFeedbackCardHtml() {
  return `
      <div class="ios-card" style="padding:16px;text-align:center;">
        <div style="font-size:15px;font-weight:700;color:#000;margin-bottom:6px;">Source &amp; feedback</div>
        <div style="font-size:14px;color:#8E8E93;margin-bottom:12px;line-height:1.5;">
          ${APP_NAME} is open source.${GITHUB_REPO_URL ? ' Report issues or view the code on GitHub.' : ''}
        </div>
        ${GITHUB_REPO_URL ? `<a href="${escHtml(GITHUB_REPO_URL)}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;background:#007AFF;color:white;text-decoration:none;border-radius:10px;padding:11px 18px;font-size:14px;font-weight:600;">
          View on GitHub
        </a>` : ''}
      </div>`;
}

// ─── Render: About Tab ────────────────────────────────────────────────────────

function renderAbout() {
  const el = document.getElementById('page-about');
  if (!el) return;

  el.innerHTML = `
    <div style="padding:20px 20px 12px;">
      <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#000;margin-bottom:4px;">About</div>
      <div style="font-size:14px;color:#8E8E93;line-height:1.5;">Why ${APP_NAME} exists</div>
    </div>

    <div style="padding:0 20px 32px;">
      <div class="ios-card" style="padding:18px 16px;margin-bottom:12px;">
        <p style="margin:0 0 14px;font-size:15px;color:#3C3C43;line-height:1.6;">
          Hi, I'm <a href="${escHtml(AUTHOR_URL)}" target="_blank" rel="noopener noreferrer" style="color:#007AFF;font-weight:600;text-decoration:none;">Elizabeth Smith</a>.
          I built ${APP_NAME} as a little side project.
        </p>
        <p style="margin:0 0 10px;font-size:15px;color:#3C3C43;line-height:1.6;">
          My partner and I have the same conversation over and over:
        </p>
        <div style="margin:0 0 14px;padding:12px 14px;background:#F2F2F7;border-radius:12px;font-size:14px;color:#636366;line-height:1.55;font-style:italic;">
          "Let's go out for dinner."<br>
          "Okay, where?"<br>
          "What are you in the mood for?"<br>
          "I don't know. Do you want something in particular?"<br>
          "Not really…"
        </div>
        <p style="margin:0 0 14px;font-size:15px;color:#3C3C43;line-height:1.6;">
          It gets frustrating! At the same time, we love trying new and different foods. We live in the OKC metro,
          which has a surprisingly strong food scene. There are lots of places we want to try — but remembering them
          when hunger strikes is hard. I built this tool to make picking easier and, hopefully, to cut down on the
          "what do you want?" / "I don't know" loop.
        </p>
        <p style="margin:0 0 14px;font-size:15px;color:#3C3C43;line-height:1.6;">
          I follow local food writer Greg Horton —
          <a href="${escHtml(GREG_HORTON_YOUTUBE_URL)}" target="_blank" rel="noopener noreferrer" style="color:#007AFF;text-decoration:none;">hear from him here</a> —
          who runs <a href="${escHtml(EATING_OKC_URL)}" target="_blank" rel="noopener noreferrer" style="color:#007AFF;font-weight:600;text-decoration:none;">Eating OKC</a>.
          Many restaurants on my list come from his writing. You'll notice his recommendations as their own tag:
          <span class="badge-tag" style="background:#E8F4FD;color:#007AFF;margin-left:2px;">eatingOKC</span>
        </p>
        <p style="margin:0 0 14px;font-size:15px;color:#3C3C43;line-height:1.6;">
          I started the first version on <a href="https://replit.com/" target="_blank" rel="noopener noreferrer" style="color:#007AFF;text-decoration:none;">Replit</a> —
          literally from my phone, by the pool — and kept expanding from there. Later I used
          <a href="https://cursor.com/" target="_blank" rel="noopener noreferrer" style="color:#007AFF;text-decoration:none;">Cursor</a>
          to help flesh out more of the details: sheet sync, the map, save-to-sheet, and the rest of what you see now.
        </p>
        <p style="margin:0;font-size:15px;color:#3C3C43;line-height:1.6;">
          I'm not sure how often I'll update this, but I'm looking forward to putting it to use. Maybe it can be useful for you too.
        </p>
      </div>

      <button onclick="switchTab('help'); setTimeout(() => { const el = document.getElementById('help-configuration'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50);"
        style="background:white;border:none;border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;width:100%;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.07);font-family:inherit;margin-bottom:12px;">
        <div style="text-align:left;">
          <div style="font-size:15px;font-weight:600;color:#000;">How to configure your setup</div>
          <div style="font-size:12px;color:#8E8E93;">Google Sheet sync &amp; save settings</div>
        </div>
        <span style="color:#007AFF;font-size:18px;">›</span>
      </button>

      ${sourceFeedbackCardHtml()}
    </div>
  `;
}

// ─── Render: Help Tab ─────────────────────────────────────────────────────────

function helpSection(title, bodyHtml, anchorId) {
  const idAttr = anchorId ? ` id="${anchorId}" style="scroll-margin-top:72px;"` : '';
  return `
    <div class="ios-card" style="padding:16px;margin-bottom:12px;"${idAttr}>
      <div style="font-size:15px;font-weight:700;color:#000;margin-bottom:8px;">${title}</div>
      <div style="font-size:14px;color:#3C3C43;line-height:1.55;">${bodyHtml}</div>
    </div>`;
}

function helpConfigHeader() {
  return `
    <div id="help-configuration" style="scroll-margin-top:72px;padding:16px 0 8px;margin-top:4px;">
      <div style="font-size:22px;font-weight:700;letter-spacing:-0.3px;color:#000;margin-bottom:4px;">Configuration</div>
      <div style="font-size:14px;color:#8E8E93;line-height:1.5;">Google Sheets &amp; Apps Script setup, then connect Pick A Spot.</div>
    </div>`;
}

function renderHelp() {
  const el = document.getElementById('page-help');
  const sheetSaved = !!getSheetUrl();

  el.innerHTML = `
    <div style="padding:20px 20px 12px;">
      <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#000;margin-bottom:4px;">How To</div>
      <div style="font-size:14px;color:#8E8E93;line-height:1.5;margin-bottom:10px;">Quick guide to using ${APP_NAME}</div>
      <a href="#help-configuration"
         style="display:inline-block;font-size:14px;font-weight:600;color:#007AFF;text-decoration:none;">
        How to configure your setup ↓
      </a>
    </div>

    <div style="padding:0 20px 32px;">
      ${helpSection('Pick a restaurant', `
        <ol style="margin:0;padding-left:1.2em;">
          <li style="margin-bottom:8px;">On <strong>Discover</strong>, set filters (location, distance, tags, reasons).</li>
          <li style="margin-bottom:8px;">Tap <strong>Find Food</strong> for three scored picks.</li>
          <li>Tap <strong>Spin Again</strong> to draw a new random 3 from the same top 10 (no re-scoring).</li>
        </ol>
      `)}

      ${helpSection('Record a visit', `
        <p style="margin:0 0 10px;">Log visits in Pick A Spot — no Google Sheet edit needed. If <strong>Save to Google Sheet</strong> is connected in Settings, visits update your sheet (<strong>lastVisited</strong>, ratings, <strong>notes</strong>).</p>
        <ol style="margin:0;padding-left:1.2em;">
          <li style="margin-bottom:8px;"><strong>Full visit log:</strong> History tab → <strong>+ Log Visit</strong> → enter ratings, notes, and date → <strong>Save Visit</strong>.</li>
          <li style="margin-bottom:8px;"><strong>Quick mark:</strong> On Discover results, tap <strong>Mark Visited</strong> on a pick.</li>
          <li><strong>Edit later:</strong> List or History → tap a restaurant to view or update details.</li>
        </ol>
        <p style="margin:12px 0 0;color:#8E8E93;font-size:13px;">
          Without a Google Sheet connection, visit data stays in Pick A Spot — use Export JSON/CSV to move between devices.
        </p>
      `)}

      ${helpSection('Add a new restaurant', `
        <ol style="margin:0;padding-left:1.2em;">
          <li style="margin-bottom:8px;">Open the <strong>List</strong> tab.</li>
          <li style="margin-bottom:8px;">Tap <strong>Add Restaurant</strong>.</li>
          <li style="margin-bottom:8px;">Fill in name, location, tier, tags, and optional last-visited date.</li>
          <li>Tap <strong>Add Restaurant</strong> to save.</li>
        </ol>
        <p style="margin:12px 0 0;color:#8E8E93;font-size:13px;">
          With <strong>Save to Google Sheet</strong> connected, new spots also save to your sheet. Otherwise export CSV and paste into Google Sheets.
        </p>
      `)}

      ${helpSection('Map &amp; area filter', `
        <ol style="margin:0;padding-left:1.2em;">
          <li style="margin-bottom:8px;">Open the <strong>Map</strong> tab — pins appear for restaurants with addresses.</li>
          <li style="margin-bottom:8px;">Tap the <strong>rectangle</strong> tool (top-right), then drag a box on the map.</li>
          <li style="margin-bottom:8px;">Only restaurants inside the box are used on <strong>Discover</strong> when you tap Find Food.</li>
          <li>Tap <strong>Clear area</strong> on the map or Discover to remove the filter.</li>
        </ol>
        <p style="margin:12px 0 0;color:#8E8E93;font-size:13px;">
          Addresses from your sheet are geocoded the first time you open the map. Run <strong>Look up missing addresses</strong> in Google Sheets for best results.
        </p>
      `)}

      ${helpConfigHeader()}

      ${helpSection('Pull sheet data into Pick A Spot', `
        <p style="margin:0 0 10px;">Use <strong>Sync Now</strong> to read your Google Sheet into Pick A Spot. This does <strong>not</strong> send anything back to the sheet.</p>
        <p style="margin:0 0 6px;font-weight:600;font-size:13px;color:#000;">In Google Sheets</p>
        <ol style="margin:0 0 14px;padding-left:1.2em;">
          <li style="margin-bottom:8px;">Add <strong>address</strong>, <strong>driveTimeMin</strong>, and <strong>distance</strong> columns; run <strong>Pick A Spot → Update all drive times</strong> (see README).</li>
          <li style="margin-bottom:8px;">Share as <strong>Anyone with the link → Viewer</strong>. If sync fails with HTTP 400, copy the <strong>Restaurants</strong> tab URL, or use <strong>File → Share → Publish to web</strong> (CSV link).</li>
        </ol>
        <p style="margin:0 0 6px;font-weight:600;font-size:13px;color:#000;">In Pick A Spot</p>
        <ol style="margin:0;padding-left:1.2em;">
          <li style="margin-bottom:8px;"><strong>Settings</strong> → <strong>Sync from Google Sheet</strong> → paste your sheet link → <strong>Save Link</strong>.</li>
          <li>Tap <strong>Sync Now</strong> on Discover or Settings after you edit the sheet or update drive times.</li>
        </ol>
        <p style="margin:12px 0 0;color:#8E8E93;font-size:13px;">
          Sheet → Pick A Spot is manual — tap Sync Now when you want fresh data.
          ${sheetSaved ? `Last synced: ${lastSheetSync()}.` : 'No sheet link saved yet — set one in Settings.'}
        </p>
      `)}

      ${helpSection('Save Pick A Spot changes to Google Sheets', `
        <p style="margin:0 0 10px;">New restaurants and visit logs can save to your Google Sheet automatically — no Sync Now. You set this up in two places: your spreadsheet's Apps Script, then Pick A Spot Settings.</p>
        <p style="margin:0 0 6px;font-weight:600;font-size:13px;color:#000;">In Google Sheets &amp; Apps Script</p>
        <ol style="margin:0 0 14px;padding-left:1.2em;">
          <li style="margin-bottom:8px;">Spreadsheet menu: <strong>Pick A Spot → Set up Config sheet</strong> (creates the write secret in <strong>Config!B2</strong>).</li>
          <li style="margin-bottom:8px;">Open <strong>Extensions → Apps Script</strong>. Choose <strong>Deploy → New deployment → Web app</strong>.</li>
          <li style="margin-bottom:8px;">Set <strong>Execute as: Me</strong> and <strong>Who has access: Anyone</strong>. Deploy and copy the <strong>Web app URL</strong> (from Apps Script — not your Pick A Spot or sheet link).</li>
        </ol>
        <p style="margin:0 0 6px;font-weight:600;font-size:13px;color:#000;">In Pick A Spot</p>
        <ol style="margin:0;padding-left:1.2em;">
          <li style="margin-bottom:8px;"><strong>Settings</strong> → <strong>Save to Google Sheet</strong>.</li>
          <li style="margin-bottom:8px;">Paste the Apps Script Web app URL and the <strong>Config!B2</strong> secret.</li>
          <li>Tap <strong>Save Google Sheet connection</strong>.</li>
        </ol>
        <p style="margin:12px 0 0;color:#8E8E93;font-size:13px;">
          ${canSheetWrite() ? 'Connected on this device — adds and visits save to your sheet automatically.' : 'Not connected yet — complete both sections above.'}
        </p>
      `)}

      ${helpSection('Drive time &amp; distance labels', `
        <p style="margin:0 0 10px;">Drive times are calculated in your Google Sheet with Apps Script (see README). The app reads <strong>driveTimeMin</strong> and <strong>distance</strong> on sync.</p>
        <ul style="margin:0;padding-left:1.2em;">
          <li style="margin-bottom:6px;"><strong>In-town</strong> — within Norman city limits</li>
          <li style="margin-bottom:6px;"><strong>Short Drive</strong> — under ${DRIVE_SHORT_MAX} minutes</li>
          <li style="margin-bottom:6px;"><strong>Longer Drive</strong> — ${DRIVE_SHORT_MAX}–${DRIVE_LONGER_MAX} minutes</li>
          <li><strong>Destination</strong> — over ${DRIVE_LONGER_MAX} minutes</li>
        </ul>
        <p style="margin:12px 0 0;color:#8E8E93;font-size:13px;">
          In the sheet: <strong>Pick A Spot → Update all drive times</strong>. Optional: set a home address here and tap <strong>Update Drive Times</strong> only if you skip the script.
        </p>
      `)}

      ${helpSection('Run your own Pick A Spot', `
        <p style="margin:0 0 10px;">Use this app with <strong>your own</strong> Google Sheet — no fork required. Or fork the repo and deploy your own copy on GitHub Pages.</p>
        <ol style="margin:0;padding-left:1.2em;">
          <li style="margin-bottom:8px;">Import <strong>example-restaurants.csv</strong> from the repo into a new Google Sheet (see README → Sheet setup).</li>
          <li style="margin-bottom:8px;">Paste <strong>PickASpotDriveTimes.gs</strong> into Extensions → Apps Script on that sheet.</li>
          <li style="margin-bottom:8px;">In Pick A Spot <strong>Settings</strong>: connect your sheet link for Sync Now, and optionally <strong>Save to Google Sheet</strong> for visit logs.</li>
        </ol>
        <p style="margin:12px 0 0;color:#8E8E93;font-size:13px;">
          Full steps: <strong>scripts/google-sheets/SETUP.md</strong> in the GitHub repo.
        </p>
      `)}

      ${sourceFeedbackCardHtml()}
    </div>
  `;
}

function renderActiveTab() {
  if (state.tab === 'discover') renderDiscover();
  else if (state.tab === 'map') renderMap();
  else if (state.tab === 'history') renderHistory();
  else if (state.tab === 'list') renderList();
  else if (state.tab === 'about') renderAbout();
  else if (state.tab === 'settings') renderSettings();
  else if (state.tab === 'help') renderHelp();
}

function updateMapToolbar(statusText) {
  const toolbar = document.getElementById('map-toolbar');
  if (!toolbar) return;
  const pinned = state.restaurants.filter(r => r.lat != null && r.lng != null).length;
  const inArea = state.mapFilter ? countMapFilterMatches() : pinned;
  toolbar.innerHTML = `
    <div style="padding:14px 16px 10px;padding-top:calc(14px + var(--safe-top));background:#F2F2F7;border-bottom:0.5px solid #E5E5EA;">
      <div style="font-size:22px;font-weight:700;letter-spacing:-0.4px;color:#000;margin-bottom:4px;">Map</div>
      <div id="map-status" style="font-size:12px;color:#8E8E93;line-height:1.4;margin-bottom:8px;">
        ${escHtml(statusText || (state.mapFilter
          ? `${inArea} places in selected area · ${pinned} on map`
          : `${pinned} places mapped · draw a box to filter Discover`))}
      </div>
      <div style="display:flex;gap:8px;">
        ${state.mapFilter ? `<button onclick="clearMapAreaFilter()" style="flex:1;background:#F2F2F7;color:#007AFF;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;">Clear area</button>` : ''}
        <button onclick="switchTab('discover')" style="flex:1;background:#007AFF;color:white;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;">
          ${state.mapFilter ? 'Pick from area' : 'Discover'}
        </button>
      </div>
    </div>`;
}

let mapSyncToken = 0;

async function renderMap() {
  const mapEl = document.getElementById('pick-a-spot-map');
  if (!mapEl) return;

  updateMapToolbar();

  await mountMapView(mapEl, {
    getRestaurants: () => state.restaurants,
    onBoundsChange: async (bounds) => {
      state.mapFilter = bounds;
      state.results = null;
      const geoCache = loadGeoCache();
      await syncMapView(state.restaurants, state.mapFilter, geoCache, (msg) => {
        const st = document.getElementById('map-status');
        if (st) st.textContent = msg;
      });
      saveGeoCache(geoCache);
      saveRestaurants();
      updateMapToolbar();
      if (state.tab === 'discover') renderDiscover();
    },
    onMarkerClick: (id) => openRestaurantDetail(id),
  });

  const token = ++mapSyncToken;
  const geoCache = loadGeoCache();
  const result = await syncMapView(state.restaurants, state.mapFilter, geoCache, (msg) => {
    if (token !== mapSyncToken) return;
    const st = document.getElementById('map-status');
    if (st) st.textContent = msg;
  });
  if (token !== mapSyncToken) return;
  saveGeoCache(geoCache);
  saveRestaurants();
  updateMapToolbar(
    state.mapFilter
      ? `${countMapFilterMatches()} in area · ${state.restaurants.filter(r => r.lat != null).length} on map`
      : result.geocoded > 0
        ? `Added ${result.geocoded} new locations`
        : undefined,
  );
  invalidateMapSize();
}

window.clearMapAreaFilter = function() {
  state.mapFilter = null;
  state.results = null;
  clearMapArea();
  renderMap();
  if (state.tab === 'discover') renderDiscover();
  showToast('Map area filter cleared');
};

// ─── Actions ──────────────────────────────────────────────────────────────────

window.switchTab = function(tab) {
  state.tab = tab;
  state.results = null;
  const pages = ['discover', 'map', 'history', 'list', 'about', 'settings', 'help'];
  pages.forEach(p => {
    const pg = document.getElementById('page-' + p);
    if (pg) pg.style.display = tab === p ? '' : 'none';
    const lbl = document.getElementById('tab-label-' + p);
    if (lbl) lbl.style.color = tab === p ? '#007AFF' : '#8E8E93';
  });
  renderActiveTab();
  if (tab === 'map' && isMapReady()) invalidateMapSize();
};

window.toggleLocation = function(loc) {
  const idx = state.filters.locations.indexOf(loc);
  if (idx > -1) state.filters.locations.splice(idx, 1);
  else state.filters.locations.push(loc);
  state.results = null;
  renderDiscover();
};

window.toggleTag = function(tag) {
  const idx = state.filters.tags.indexOf(tag);
  if (idx > -1) state.filters.tags.splice(idx, 1);
  else state.filters.tags.push(tag);
  state.results = null;
  renderDiscover();
};

window.toggleDistance = function(d) {
  const idx = state.filters.distance.indexOf(d);
  if (idx > -1) state.filters.distance.splice(idx, 1);
  else state.filters.distance.push(d);
  state.results = null;
  renderDiscover();
};

window.toggleReason = function(reason) {
  const idx = state.filters.reasons.indexOf(reason);
  if (idx > -1) state.filters.reasons.splice(idx, 1);
  else state.filters.reasons.push(reason);
  state.results = null;
  renderDiscover();
};

window.clearFilters = function() {
  state.filters = { locations: [], tags: [], distance: [], reasons: [] };
  state.results = null;
  renderDiscover();
};

window.handleFindFood = function() {
  const results = findRecommendations();
  state.results = results;
  renderDiscover();
  requestAnimationFrame(() => {
    const pg = document.getElementById('page-discover');
    pg.scrollTo({ top: pg.scrollHeight, behavior: 'smooth' });
  });
};

window.handleSpinAgain = function() {
  // Animate the dice icon
  const icon = document.getElementById('spin-icon');
  if (icon) {
    icon.style.transform = 'rotate(360deg) scale(1.3)';
    setTimeout(() => { icon.style.transform = ''; }, 450);
  }
  state.results = pickThreeFromPool();
  // Re-render just the results area without losing scroll position
  const pg = document.getElementById('page-discover');
  const scrollY = pg.scrollTop;
  renderDiscover();
  requestAnimationFrame(() => { pg.scrollTop = scrollY; });
};

window.handleListSearch = function(val) {
  const cursor = document.getElementById('list-search')?.selectionStart;
  state.listSearch = val;
  renderList();
  requestAnimationFrame(() => {
    const inp = document.getElementById('list-search');
    if (!inp) return;
    inp.focus();
    const pos = cursor != null ? Math.min(cursor, inp.value.length) : inp.value.length;
    inp.setSelectionRange(pos, pos);
  });
};

window.markVisitedId = function(id) {
  const r = state.restaurants.find(r => r.id === id);
  if (!r) return;
  r.lastVisited = today();
  saveRestaurants();
  renderDiscover();
  showToast(`${r.name} marked as visited today!`);
};

// ─── Log a Visit Modal ────────────────────────────────────────────────────────

window.openLogVisit = function() {
  const root = document.getElementById('modal-root');
  const tierOptions    = TIERS.map(t     => `<option value="${escHtml(t)}">${escHtml(t)}</option>`).join('');
  const locationOptions= LOCATIONS.map(l => `<option value="${escHtml(l)}">${escHtml(l)}</option>`).join('');
  const tagCheckboxes  = ALL_TAGS.map(tag => `
    <label style="display:flex;align-items:center;gap:9px;padding:8px 0;cursor:pointer;font-size:14px;color:#000;border-bottom:0.5px solid #F5F5F5;">
      <input type="checkbox" name="lv-tags" value="${escHtml(tag)}" style="width:17px;height:17px;accent-color:#007AFF;flex-shrink:0;" />
      ${escHtml(tag)}
    </label>`).join('');
  const reasonCheckboxes = REASONS.map(reason => `
    <label style="display:flex;align-items:center;gap:9px;padding:8px 0;cursor:pointer;font-size:14px;color:#000;border-bottom:0.5px solid #F5F5F5;">
      <input type="checkbox" name="lv-reasons" value="${escHtml(reason)}" style="width:17px;height:17px;accent-color:#007AFF;flex-shrink:0;" />
      ${escHtml(reason)}
    </label>`).join('');

  root.innerHTML = `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="sheet" onclick="event.stopPropagation()">
        <div class="handle"></div>

        <div style="padding:8px 20px 4px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:17px;font-weight:700;color:#000;">Log a Visit</div>
            <div style="font-size:12px;color:#8E8E93;margin-top:1px;">Add a restaurant you've already been to</div>
          </div>
          <button onclick="closeModal()" style="background:rgba(118,118,128,0.18);border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;color:#8E8E93;flex-shrink:0;">✕</button>
        </div>

        <div style="padding:14px 20px;display:flex;flex-direction:column;gap:20px;">

          <!-- ── About the Place ── -->
          <div>
            <div style="font-size:13px;font-weight:700;color:#000;letter-spacing:-0.1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1.5px solid #F2F2F7;">About the Place</div>
            <div style="display:flex;flex-direction:column;gap:9px;">
              <div>
                <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:5px;">Name *</div>
                <input id="lv-name" class="ios-input" type="text" placeholder="Restaurant name" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                  <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:5px;">Location</div>
                  <select id="lv-location" class="ios-select">${locationOptions}</select>
                </div>
                <div>
                  <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:5px;">Tier</div>
                  <select id="lv-tier" class="ios-select">${tierOptions}</select>
                </div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:5px;">Address</div>
                <input id="lv-address" class="ios-input" type="text" placeholder="Street address (optional)" />
              </div>
            </div>
          </div>

          <!-- ── Tags ── -->
          <div>
            <div style="font-size:13px;font-weight:700;color:#000;letter-spacing:-0.1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1.5px solid #F2F2F7;">Tags</div>
            <div class="ios-card" style="padding:0 12px;">${tagCheckboxes}</div>
          </div>

          <!-- ── Reasons ── -->
          <div>
            <div style="font-size:13px;font-weight:700;color:#000;letter-spacing:-0.1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1.5px solid #F2F2F7;">Reasons</div>
            <div class="ios-card" style="padding:0 12px;">${reasonCheckboxes}</div>
          </div>

          <!-- ── Visit Details ── -->
          <div>
            <div style="font-size:13px;font-weight:700;color:#000;letter-spacing:-0.1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1.5px solid #F2F2F7;">Visit Details</div>
            <div class="ios-card" style="padding:16px;display:flex;flex-direction:column;gap:16px;">
              <div>
                <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">Date Visited</div>
                <input id="lv-visited" class="ios-input" type="date" value="${today()}" max="${today()}" />
              </div>
              <div style="height:0.5px;background:#F2F2F7;"></div>
              ${starPicker('lv-food',    null, 'Food')}
              ${starPicker('lv-vibe',    null, 'Vibe')}
              ${starPicker('lv-service', null, 'Service / Experience')}
              <div style="height:0.5px;background:#F2F2F7;"></div>
              ${pillPicker('lv-parking', ['Easy','Street','Paid','Difficult'], null, 'Parking')}
              ${pillPicker('lv-cost',    ['$','$$','$$$','$$$$'],              null, 'Cost')}
              <div style="height:0.5px;background:#F2F2F7;"></div>
              <div>
                <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:7px;">Notes</div>
                <textarea id="lv-notes" placeholder="Dishes to remember, vibes, memories…" style="width:100%;min-height:80px;background:#F8F8F8;border:none;border-radius:10px;padding:11px 13px;font-size:14px;font-family:inherit;color:#000;resize:none;outline:none;line-height:1.5;"></textarea>
              </div>
            </div>
          </div>

          <button onclick="submitLogVisit()" style="background:linear-gradient(145deg,#007AFF,#0055D4);color:white;border:none;border-radius:14px;padding:17px;font-size:17px;font-weight:600;font-family:inherit;width:100%;cursor:pointer;box-shadow:0 4px 14px rgba(0,122,255,0.3);">
            Save Visit
          </button>

        </div>
      </div>
    </div>`;
};

window.submitLogVisit = async function() {
  const name = document.getElementById('lv-name').value.trim();
  if (!name) {
    const el = document.getElementById('lv-name');
    el.style.outline = '2px solid #FF3B30';
    el.focus();
    setTimeout(() => { el.style.outline = 'none'; }, 1800);
    return;
  }

  const location    = document.getElementById('lv-location').value;
  const tier        = document.getElementById('lv-tier').value;
  const address     = (document.getElementById('lv-address')?.value || '').trim();
  const lastVisited = document.getElementById('lv-visited').value || today();
  const tags        = [...document.querySelectorAll('input[name="lv-tags"]:checked')].map(e => e.value);
  const reasons     = [...document.querySelectorAll('input[name="lv-reasons"]:checked')].map(e => e.value);
  const food    = parseInt(document.getElementById('lv-food')?.value)    || null;
  const vibe    = parseInt(document.getElementById('lv-vibe')?.value)    || null;
  const service = parseInt(document.getElementById('lv-service')?.value) || null;
  const parking = document.getElementById('lv-parking')?.value || null;
  const cost    = document.getElementById('lv-cost')?.value    || null;
  const notes   = (document.getElementById('lv-notes')?.value || '').trim();

  const newR = {
    id: genId(),
    name,
    location,
    tier,
    tags,
    reasons,
    address,
    distance: '',
    driveTimeMin: null,
    dateSaved:   today(),
    lastVisited,
    ratings: { food, vibe, service, parking: parking || null, cost: cost || null },
    notes,
  };

  state.restaurants.push(newR);
  saveRestaurants();
  apiCreate(newR);
  if (getHomeAddress()) {
    await recalculateDistances();
  }
  closeModal();
  renderHistory();
  showToast(`${name} logged!`);
};

// ─── Add Restaurant Modal ─────────────────────────────────────────────────────

window.openAddRestaurant = function() {
  const root = document.getElementById('modal-root');
  const tierOptions = TIERS.map(t => `<option value="${escHtml(t)}">${escHtml(t)}</option>`).join('');
  const locationOptions = LOCATIONS.map(l => `<option value="${escHtml(l)}">${escHtml(l)}</option>`).join('');
  const tagCheckboxes = ALL_TAGS.map(tag => `
    <label style="display:flex;align-items:center;gap:8px;padding:8px 0;cursor:pointer;font-size:14px;color:#000;">
      <input type="checkbox" name="tags" value="${escHtml(tag)}" style="width:17px;height:17px;accent-color:#007AFF;" />
      ${escHtml(tag)}
    </label>`).join('');
  const reasonCheckboxes = REASONS.map(reason => `
    <label style="display:flex;align-items:center;gap:8px;padding:8px 0;cursor:pointer;font-size:14px;color:#000;">
      <input type="checkbox" name="reasons" value="${escHtml(reason)}" style="width:17px;height:17px;accent-color:#007AFF;" />
      ${escHtml(reason)}
    </label>`).join('');

  root.innerHTML = `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="sheet" onclick="event.stopPropagation()">
        <div class="handle"></div>
        <div style="padding:8px 20px 0;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:17px;font-weight:600;color:#000;">Add Restaurant</div>
          <button onclick="closeModal()" style="background:rgba(118,118,128,0.18);border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;color:#8E8E93;">✕</button>
        </div>
        <div style="padding:16px 20px;">
          <div style="margin-bottom:12px;">
            <div style="font-size:12px;font-weight:600;color:#8E8E93;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:6px;">Name *</div>
            <input id="add-name" class="ios-input" type="text" placeholder="Restaurant name" />
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:12px;font-weight:600;color:#8E8E93;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:6px;">Location *</div>
            <select id="add-location" class="ios-select">
              ${locationOptions}
            </select>
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:12px;font-weight:600;color:#8E8E93;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:6px;">Tier *</div>
            <select id="add-tier" class="ios-select">
              ${tierOptions}
            </select>
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:12px;font-weight:600;color:#8E8E93;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:6px;">Address</div>
            <input id="add-address" class="ios-input" type="text" placeholder="Street address (for drive time)" />
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:12px;font-weight:600;color:#8E8E93;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:6px;">Tags</div>
            <div class="ios-card" style="padding:4px 12px;">${tagCheckboxes}</div>
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:12px;font-weight:600;color:#8E8E93;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:6px;">Reasons</div>
            <div class="ios-card" style="padding:4px 12px;">${reasonCheckboxes}</div>
          </div>
          <div style="margin-bottom:24px;">
            <div style="font-size:12px;font-weight:600;color:#8E8E93;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:6px;">Last Visited</div>
            <input id="add-visited" class="ios-input" type="date" max="${today()}" />
          </div>
          <button onclick="submitAddRestaurant()" style="background:linear-gradient(145deg,#007AFF,#0055D4);color:white;border:none;border-radius:14px;padding:16px;font-size:17px;font-weight:600;font-family:inherit;width:100%;cursor:pointer;box-shadow:0 4px 14px rgba(0,122,255,0.3);">
            Add Restaurant
          </button>
        </div>
      </div>
    </div>`;
};

window.submitAddRestaurant = async function() {
  const name = document.getElementById('add-name').value.trim();
  if (!name) { shakeEl('add-name'); return; }
  const location = document.getElementById('add-location').value;
  const tier = document.getElementById('add-tier').value;
  const address = (document.getElementById('add-address')?.value || '').trim();
  const lastVisited = document.getElementById('add-visited').value || null;
  const tags = [...document.querySelectorAll('input[name="tags"]:checked')].map(el => el.value);
  const reasons = [...document.querySelectorAll('input[name="reasons"]:checked')].map(el => el.value);
  const newR = {
    id: genId(),
    name,
    location,
    tier,
    tags,
    reasons,
    address,
    distance: '',
    driveTimeMin: null,
    dateSaved: today(),
    lastVisited,
  };
  state.restaurants.push(newR);
  saveRestaurants();
  apiCreate(newR);
  closeModal();
  if (getHomeAddress()) {
    await recalculateDistances();
  }
  renderList();
  showToast(`${name} added!`);
};

// ─── Restaurant Detail Modal ──────────────────────────────────────────────────

window.openRestaurantDetail = function(id) {
  const r = state.restaurants.find(r => r.id === id);
  if (!r) return;
  const root = document.getElementById('modal-root');
  const tierCfg = TIER_COLORS[r.tier] || { bg: '#F2F2F7', text: '#3C3C43', dot: '#8E8E93' };
  const tagBadges = r.tags.map(tag => {
    const c = tagColor(tag);
    return `<span class="badge-tag" style="background:${c.bg};color:${c.text};">${escHtml(tag)}</span>`;
  }).join('');
  const reasonBadges = (r.reasons || []).map(reason => {
    return `<span class="badge-tag" style="background:#FFF8E1;color:#B25D00;">${escHtml(reason)}</span>`;
  }).join('');
  const score = scoreRestaurant(r);
  const scoreColor = score >= 7 ? '#34C759' : score >= 4 ? '#007AFF' : score >= 0 ? '#FF9500' : '#FF3B30';
  const tierOptionHtml = TIERS.map(t =>
    `<option value="${escHtml(t)}" ${r.tier === t ? 'selected' : ''}>${escHtml(t)}</option>`
  ).join('');
  const locationOptionHtml = LOCATIONS.map(l =>
    `<option value="${escHtml(l)}" ${r.location === l ? 'selected' : ''}>${escHtml(l)}</option>`
  ).join('');
  const reasonCheckboxHtml = REASONS.map(reason => `
    <label style="display:flex;align-items:center;gap:8px;padding:8px 0;cursor:pointer;font-size:14px;color:#000;">
      <input type="checkbox" name="detail-reasons" value="${escHtml(reason)}" ${(r.reasons||[]).includes(reason) ? 'checked' : ''} style="width:17px;height:17px;accent-color:#007AFF;" />
      ${escHtml(reason)}
    </label>`).join('');

  root.innerHTML = `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="sheet" onclick="event.stopPropagation()">
        <div class="handle"></div>
        <div style="padding:8px 20px 0;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:17px;font-weight:600;color:#000;">Restaurant Details</div>
          <button onclick="closeModal()" style="background:rgba(118,118,128,0.18);border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;color:#8E8E93;">✕</button>
        </div>

        <div style="padding:16px 20px 8px;">
          <div class="ios-card-lg" style="background:linear-gradient(135deg,${tierCfg.bg} 0%,white 60%);padding:18px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
              <div style="flex:1;">
                <div style="font-size:22px;font-weight:700;letter-spacing:-0.4px;color:#000;margin-bottom:4px;">${escHtml(r.name)}</div>
                <div style="font-size:13px;color:#8E8E93;margin-bottom:10px;">📍 ${escHtml(r.location)}</div>
                <span style="display:inline-block;background:${tierCfg.bg};color:${tierCfg.text};padding:4px 10px;border-radius:100px;font-size:11px;font-weight:700;">
                  <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${tierCfg.dot};margin-right:4px;vertical-align:middle;margin-bottom:1px;"></span>${escHtml(r.tier)}
                </span>
              </div>
              <div style="text-align:center;">
                <div style="width:54px;height:54px;border-radius:50%;background:${scoreColor}15;border:2px solid ${scoreColor}25;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                  <div style="font-size:20px;font-weight:700;color:${scoreColor};line-height:1;">${score}</div>
                  <div style="font-size:9px;color:${scoreColor};font-weight:600;margin-top:1px;">SCORE</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style="padding:0 20px 8px;">
          <div class="ios-card" style="overflow:visible;">
            <div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;">
              <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">Tags</div>
              <div style="display:flex;flex-wrap:wrap;gap:5px;">${tagBadges || '<span style="font-size:13px;color:#C7C7CC;">No tags</span>'}</div>
            </div>
            <div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;">
              <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">Reasons</div>
              <div style="display:flex;flex-wrap:wrap;gap:5px;">${reasonBadges || '<span style="font-size:13px;color:#C7C7CC;">No reasons</span>'}</div>
            </div>
            <div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;">
              <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px;">Visit History</div>
              <div style="font-size:14px;color:#000;font-weight:500;">Last visited: ${formatDate(r.lastVisited)}</div>
              <div style="font-size:12px;color:#8E8E93;margin-top:2px;">Saved: ${formatDate(r.dateSaved)}</div>
            </div>
            <div style="padding:14px 16px;">
              <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">Update Last Visited</div>
              <div style="display:flex;gap:8px;align-items:center;">
                <input id="detail-visited-date" type="date" class="ios-input" style="flex:1;" value="${r.lastVisited || ''}" max="${today()}" />
                <button onclick="saveLastVisited('${escHtml(r.id)}')" style="background:#007AFF;color:white;border:none;border-radius:10px;padding:11px 14px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;white-space:nowrap;flex-shrink:0;">Save</button>
              </div>
              <button onclick="markTodayVisit('${escHtml(r.id)}')" style="margin-top:8px;background:#E3F2FD;color:#007AFF;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;width:100%;">
                Visited Today
              </button>
            </div>
          </div>
        </div>

        <div style="padding:0 20px 8px;">
          <div class="ios-card" style="padding:16px;display:flex;flex-direction:column;gap:18px;">
            <div style="font-size:16px;font-weight:700;color:#000;letter-spacing:-0.2px;">Your Review</div>

            ${starPicker('rev-food',    (r.ratings||{}).food,    'Food')}
            ${starPicker('rev-vibe',    (r.ratings||{}).vibe,    'Vibe')}
            ${starPicker('rev-service', (r.ratings||{}).service, 'Service / Experience')}

            <div style="height:0.5px;background:#F2F2F7;margin:0 -4px;"></div>

            ${pillPicker('rev-parking', ['Easy','Street','Paid','Difficult'], (r.ratings||{}).parking, 'Parking')}
            ${pillPicker('rev-cost',    ['$','$$','$$$','$$$$'],              (r.ratings||{}).cost,    'Cost')}

            <div style="height:0.5px;background:#F2F2F7;margin:0 -4px;"></div>

            <div>
              <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:7px;">Notes</div>
              <textarea id="rev-notes" placeholder="Any memories, dishes to order, things to remember…" style="width:100%;min-height:88px;background:#F8F8F8;border:none;border-radius:10px;padding:11px 13px;font-size:14px;font-family:inherit;color:#000;resize:none;outline:none;line-height:1.5;">${escHtml(r.notes || '')}</textarea>
            </div>
          </div>
        </div>

        <div style="padding:0 20px 8px;">
          <div class="ios-card">
            <div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;">
              <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">Tier</div>
              <select id="detail-tier" class="ios-select" style="box-shadow:none;padding-left:0;">${tierOptionHtml}</select>
            </div>
            <div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;">
              <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">Location</div>
              <select id="detail-location" class="ios-select" style="box-shadow:none;padding-left:0;">${locationOptionHtml}</select>
            </div>
            <div style="padding:14px 16px;border-bottom:0.5px solid #F2F2F7;">
              <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">Address</div>
              <input id="detail-address" class="ios-input" type="text" value="${escHtml(r.address || '')}" placeholder="Street address (for drive time)" />
            </div>
            <div style="padding:14px 16px;">
              <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px;">Drive Time</div>
              <div style="font-size:14px;color:#000;font-weight:500;">${escHtml(formatDistanceLabel(r) || 'Set home address and tap Update Drive Times')}</div>
            </div>
          </div>
          <div class="ios-card" style="margin-top:10px;padding:4px 16px;">
            <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin:10px 0 2px;">Reasons</div>
            ${reasonCheckboxHtml}
          </div>
          <button onclick="saveDetailChanges('${escHtml(r.id)}')" style="margin-top:10px;background:linear-gradient(145deg,#007AFF,#0055D4);color:white;border:none;border-radius:14px;padding:15px;font-size:16px;font-weight:600;font-family:inherit;width:100%;cursor:pointer;box-shadow:0 4px 14px rgba(0,122,255,0.28);">
            Save Changes
          </button>
        </div>

        <div style="padding:8px 20px 16px;">
          <button onclick="deleteRestaurant('${escHtml(r.id)}','${escHtml(r.name)}')" style="background:#FFF0F0;color:#FF3B30;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:600;font-family:inherit;width:100%;cursor:pointer;">
            Remove from List
          </button>
        </div>
      </div>
    </div>`;
};

window.markTodayVisit = function(id) {
  const r = state.restaurants.find(r => r.id === id);
  if (!r) return;
  r.lastVisited = today();
  saveRestaurants();
  apiSave(r);
  closeModal();
  renderList();
  showToast(`${r.name} marked as visited today!`);
};

window.saveLastVisited = function(id) {
  const r = state.restaurants.find(r => r.id === id);
  if (!r) return;
  const val = document.getElementById('detail-visited-date').value;
  if (!val) return;
  r.lastVisited = val;
  saveRestaurants();
  apiSave(r);
  closeModal();
  renderList();
  showToast(`Visit date updated!`);
};

window.saveDetailChanges = async function(id) {
  const r = state.restaurants.find(r => r.id === id);
  if (!r) return;
  const tier        = document.getElementById('detail-tier').value;
  const location    = document.getElementById('detail-location').value;
  const address     = (document.getElementById('detail-address')?.value || '').trim();
  const visitedDate = document.getElementById('detail-visited-date').value;
  const reasons     = [...document.querySelectorAll('input[name="detail-reasons"]:checked')].map(e => e.value);
  if (tier)        r.tier        = tier;
  if (location)    r.location    = location;
  r.address = address;
  if (visitedDate) r.lastVisited = visitedDate;
  r.reasons = reasons;

  const food    = parseInt(document.getElementById('rev-food')?.value)    || null;
  const vibe    = parseInt(document.getElementById('rev-vibe')?.value)    || null;
  const service = parseInt(document.getElementById('rev-service')?.value) || null;
  const parking = document.getElementById('rev-parking')?.value || null;
  const cost    = document.getElementById('rev-cost')?.value    || null;
  const notes   = (document.getElementById('rev-notes')?.value || '').trim();

  r.ratings = { food, vibe, service, parking: parking || null, cost: cost || null };
  r.notes   = notes;

  saveRestaurants();
  apiSave(r);
  if (getHomeAddress()) {
    await recalculateDistances();
  }
  closeModal();
  if (state.tab === 'history') renderHistory();
  else renderList();
  showToast('Changes saved!');
};

window.deleteRestaurant = function(id, name) {
  if (!confirm(`Remove "${name}" from your list?`)) return;
  state.restaurants = state.restaurants.filter(r => r.id !== id);
  saveRestaurants();
  apiRemove(id);
  closeModal();
  renderList();
  showToast(`${name} removed.`);
};

window.closeModal = function() {
  document.getElementById('modal-root').innerHTML = '';
};

// ─── Review Helpers ───────────────────────────────────────────────────────────

function starPicker(fieldId, currentVal, label) {
  const val = currentVal || 0;
  const stars = [1,2,3,4,5].map(n =>
    `<span onclick="setRating('${fieldId}',${n})" id="${fieldId}-s${n}" style="font-size:30px;cursor:pointer;line-height:1;transition:transform 0.12s;">${n <= val ? '★' : '☆'}</span>`
  ).join('');
  return `
    <div>
      <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:7px;">${label}</div>
      <div style="display:flex;gap:4px;align-items:center;">${stars}</div>
      <input type="hidden" id="${fieldId}" value="${val || ''}" />
    </div>`;
}

function pillPicker(fieldId, options, currentVal, label) {
  const pills = options.map(opt => {
    const on = opt === currentVal;
    return `<button onclick="setPill('${fieldId}','${escHtml(opt)}')" id="${fieldId}-p-${escHtml(opt)}" style="padding:6px 14px;border-radius:100px;border:none;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.15s;background:${on?'#007AFF':'white'};color:${on?'white':'#3C3C43'};box-shadow:${on?'0 2px 8px rgba(0,122,255,0.28)':'0 1px 3px rgba(0,0,0,0.08)'};">${escHtml(opt)}</button>`;
  }).join('');
  return `
    <div>
      <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:7px;">${label}</div>
      <div style="display:flex;flex-wrap:wrap;gap:7px;">${pills}</div>
      <input type="hidden" id="${fieldId}" value="${escHtml(currentVal || '')}" />
    </div>`;
}

window.setRating = function(fieldId, n) {
  const inp = document.getElementById(fieldId);
  if (!inp) return;
  const cur = parseInt(inp.value) || 0;
  const newVal = cur === n ? 0 : n;
  inp.value = newVal;
  for (let i = 1; i <= 5; i++) {
    const s = document.getElementById(fieldId + '-s' + i);
    if (s) s.textContent = i <= newVal ? '★' : '☆';
  }
};

window.setPill = function(fieldId, val) {
  const inp = document.getElementById(fieldId);
  if (!inp) return;
  const cur = inp.value;
  const newVal = cur === val ? '' : val;
  inp.value = newVal;
  document.querySelectorAll(`[id^="${fieldId}-p-"]`).forEach(btn => {
    const bval = btn.id.slice((fieldId + '-p-').length);
    const on = bval === newVal;
    btn.style.background = on ? '#007AFF' : 'white';
    btn.style.color = on ? 'white' : '#3C3C43';
    btn.style.boxShadow = on ? '0 2px 8px rgba(0,122,255,0.28)' : '0 1px 3px rgba(0,0,0,0.08)';
  });
};

// ─── Export / Import ─────────────────────────────────────────────────────────

window.exportData = function() {
  const json = JSON.stringify(state.restaurants, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pick-a-spot-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${state.restaurants.length} restaurants`);
};

window.importData = function() {
  const input = document.getElementById('import-file-input');
  if (input) { input.value = ''; input.click(); }
};

window.handleImportFile = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) throw new Error('Not an array');
      // Validate basic shape
      const valid = parsed.every(r => r.id && r.name && r.tier);
      if (!valid) throw new Error('Invalid restaurant format');

      // Merge: keep existing restaurants, add/update from import by id
      const existingIds = new Map(state.restaurants.map(r => [r.id, r]));
      let added = 0, updated = 0;
      parsed.forEach(r => {
        if (existingIds.has(r.id)) {
          Object.assign(existingIds.get(r.id), r);
          updated++;
        } else {
          state.restaurants.push(r);
          added++;
        }
      });
      saveRestaurants();
      if (USE_API) apiBulk(parsed).then(() => showToast('Synced to server ✓'));
      renderList();
      showToast(`Imported: ${added} added, ${updated} updated`);
    } catch (err) {
      showToast('Import failed — invalid JSON format');
    }
  };
  reader.readAsText(file);
};

// ─── Google Sheet Sync ──────────────────────────────────────────────────────────

function getSheetUrl() {
  return localStorage.getItem(SHEET_URL_KEY) || '';
}

function lastSheetSync() {
  const ts = localStorage.getItem(SHEET_SYNC_KEY);
  if (!ts) return 'never';
  const d = new Date(Number(ts));
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

window.saveHomeAddress = async function() {
  const input = document.getElementById('home-address-input');
  const addr = (input?.value || '').trim();
  localStorage.setItem(HOME_ADDRESS_KEY, addr);
  showToast(addr ? 'Home address saved' : 'Home address cleared');
  if (addr && state.restaurants.length > 0) {
    await recalculateDistances();
  }
  renderActiveTab();
};

window.updateDriveTimes = async function() {
  await recalculateDistances();
  renderActiveTab();
};

window.openGoogleSheet = function() {
  const url = getSheetUrl().trim();
  if (!url) {
    showToast('No sheet link saved — set one in Settings');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

window.saveSheetUrl = function() {
  const input = document.getElementById('sheet-url-input');
  const url = (input?.value || '').trim();
  localStorage.setItem(SHEET_URL_KEY, url);
  showToast(url ? 'Sheet link saved' : 'Sheet link cleared');
  renderActiveTab();
};

window.saveSheetWriteBack = function() {
  const url = (document.getElementById('sheet-write-url-input')?.value || '').trim();
  const secret = (document.getElementById('sheet-write-secret-input')?.value || '').trim();
  saveSheetWriteConfig(url, secret);
  showToast(url && secret ? 'Google Sheet connection saved' : 'Google Sheet connection cleared');
  renderActiveTab();
};

window.syncFromSheet = async function() {
  const input = document.getElementById('sheet-url-input');
  const url = (input?.value || getSheetUrl()).trim();
  if (!url) {
    showToast('Paste a Google Sheet link in Settings first');
    return;
  }
  localStorage.setItem(SHEET_URL_KEY, url);
  showToast('Syncing from sheet…');
  const result = await syncRestaurantsFromSheetUrl(url);
  if (result.error) {
    showToast(result.error);
    return;
  }
  localStorage.setItem(SHEET_SYNC_KEY, String(Date.now()));
  state.restaurants = result.restaurants;
  state.results = null;
  saveRestaurants();
  renderActiveTab();
  showToast(`Synced ${result.synced} restaurants from sheet ✓`);
};

// ─── CSV Export / Import ────────────────────────────────────────────────────────

const CSV_COLUMNS = [
  'id', 'name', 'location', 'tier', 'address', 'distance', 'driveTimeMin', 'tags', 'reasons',
  'dateSaved', 'lastVisited', 'food', 'vibe', 'service', 'parking', 'cost', 'notes'
];

function csvEscape(val) {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function restaurantToRow(r) {
  return [
    r.id,
    r.name,
    r.location,
    r.tier,
    r.address || '',
    r.distance || '',
    r.driveTimeMin ?? '',
    (r.tags || []).join('; '),
    (r.reasons || []).join('; '),
    r.dateSaved || '',
    r.lastVisited || '',
    r.ratings?.food ?? '',
    r.ratings?.vibe ?? '',
    r.ratings?.service ?? '',
    r.ratings?.parking ?? '',
    r.ratings?.cost ?? '',
    r.notes || '',
  ];
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function rowToRestaurant(rowObj, existing) {
  const num = (v) => (v === '' || v === undefined || v === null) ? null : Number(v);
  const boolVal = String(rowObj.acclaimed || '').trim().toUpperCase();
  const driveTimeMin = rowObj.driveTimeMin !== '' && rowObj.driveTimeMin != null
    ? num(rowObj.driveTimeMin)
    : (existing?.driveTimeMin ?? null);
  let distance = rowObj.distance || existing?.distance || '';
  if (!distance && driveTimeMin != null) {
    distance = rowObj.location === 'Norman' ? 'In-town' : bucketFromDriveMinutes(driveTimeMin);
  }
  return {
    id: existing?.id ?? (rowObj.id && rowObj.id.trim() ? rowObj.id.trim() : genId()),
    name: (rowObj.name || '').trim(),
    location: rowObj.location || existing?.location || 'OKC - City',
    tier: rowObj.tier || existing?.tier || TIERS[0],
    address: rowObj.address || existing?.address || '',
    distance,
    driveTimeMin,
    tags: (rowObj.tags || '').split(/[;,]/).map(t => t.trim()).filter(Boolean),
    reasons: (rowObj.reasons || '').split(/[;,]/).map(t => t.trim()).filter(Boolean),
    acclaimed: boolVal === 'TRUE' || boolVal === 'YES' || boolVal === '1',
    dateSaved: rowObj.dateSaved || existing?.dateSaved || today(),
    lastVisited: rowObj.lastVisited || null,
    ratings: {
      food: num(rowObj.food),
      vibe: num(rowObj.vibe),
      service: num(rowObj.service),
      parking: rowObj.parking || null,
      cost: rowObj.cost || null,
    },
    notes: rowObj.notes || '',
  };
}

function parseSheetLink(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/output=csv|format=csv|out:csv|\.csv($|\?)/i.test(trimmed)) {
    return { directUrl: trimmed };
  }

  const pubMatch = trimmed.match(/spreadsheets\/d\/e\/([^/]+)/);
  if (pubMatch) {
    return { publishId: pubMatch[1] };
  }

  const idMatch = trimmed.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return { directUrl: trimmed };

  const gidMatch = trimmed.match(/[#?&]gid=(\d+)/);
  return {
    spreadsheetId: idMatch[1],
    gid: gidMatch ? gidMatch[1] : null,
  };
}

function sheetCsvFetchUrls(input) {
  const parsed = parseSheetLink(input);
  if (!parsed) return [];

  if (parsed.directUrl) return [parsed.directUrl];

  if (parsed.publishId) {
    return [`https://docs.google.com/spreadsheets/d/e/${parsed.publishId}/pub?output=csv`];
  }

  const { spreadsheetId, gid } = parsed;
  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  const urls = [];

  if (gid != null) {
    urls.push(`${base}/export?format=csv&gid=${gid}`);
    urls.push(`${base}/gviz/tq?tqx=out:csv&gid=${gid}`);
  } else {
    urls.push(`${base}/gviz/tq?tqx=out:csv&sheet=Restaurants`);
    urls.push(`${base}/export?format=csv&gid=0`);
    urls.push(`${base}/gviz/tq?tqx=out:csv&gid=0`);
  }

  return [...new Set(urls)];
}

function sheetSyncErrorMessage(status) {
  const base = status
    ? `Could not fetch sheet (HTTP ${status}).`
    : 'Could not fetch sheet.';
  return `${base} Try: (1) open your Restaurants tab and copy the browser URL (include #gid=…), (2) share as Anyone with the link → Viewer, or (3) File → Share → Publish to web (CSV) and paste that link.`;
}

function toSheetCsvUrl(input) {
  const urls = sheetCsvFetchUrls(input);
  return urls[0] || input.trim();
}

function restaurantsFromSheetCsv(csvText, existing) {
  const rows = parseCSV(csvText);
  if (rows.length < 2) throw new Error('Sheet has no data rows');
  const header = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1);
  const byId = new Map(existing.map(r => [r.id, r]));
  const byName = new Map(existing.map(r => [r.name.trim().toLowerCase(), r]));
  const upserts = [];

  dataRows.forEach(cells => {
    const rowObj = {};
    header.forEach((h, i) => { rowObj[h] = cells[i] !== undefined ? cells[i] : ''; });
    if (!rowObj.name || !rowObj.name.trim()) return;

    const matchedById = rowObj.id && rowObj.id.trim() ? byId.get(rowObj.id.trim()) : undefined;
    const matchedByName = byName.get(rowObj.name.trim().toLowerCase());
    const existingRow = matchedById ?? matchedByName;
    upserts.push(rowToRestaurant(rowObj, existingRow));
  });

  if (upserts.length === 0) throw new Error('No valid rows found in sheet');
  return upserts;
}

async function syncRestaurantsFromSheetUrl(url) {
  const csvUrls = sheetCsvFetchUrls(url);
  if (csvUrls.length === 0) {
    return { error: 'Paste a valid Google Sheets link.' };
  }

  let fetchRes;
  let lastStatus;
  for (const csvUrl of csvUrls) {
    try {
      const res = await fetch(csvUrl);
      if (res.ok) {
        fetchRes = res;
        break;
      }
      lastStatus = res.status;
    } catch {
      lastStatus = null;
    }
  }

  if (!fetchRes) {
    return { error: sheetSyncErrorMessage(lastStatus) };
  }
  try {
    const csvText = await fetchRes.text();
    const upserts = restaurantsFromSheetCsv(csvText, state.restaurants);
    const byId = new Map(state.restaurants.map(r => [r.id, r]));
    upserts.forEach(r => byId.set(r.id, r));
    const merged = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
    return { synced: upserts.length, restaurants: merged };
  } catch (err) {
    return { error: err.message || 'Failed to parse sheet' };
  }
}

window.exportCSV = function() {
  const lines = [CSV_COLUMNS.map(csvEscape).join(',')];
  state.restaurants.forEach(r => {
    lines.push(restaurantToRow(r).map(csvEscape).join(','));
  });
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pick-a-spot-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${state.restaurants.length} restaurants to CSV`);
};

window.importCSV = function() {
  const input = document.getElementById('import-csv-file-input');
  if (input) { input.value = ''; input.click(); }
};

window.handleImportCSVFile = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const rows = parseCSV(e.target.result);
      if (rows.length < 2) throw new Error('No data rows found');
      const header = rows[0].map(h => h.trim());
      const dataRows = rows.slice(1);

      const existingIds = new Map(state.restaurants.map(r => [r.id, r]));
      let added = 0, updated = 0;
      const parsedList = [];

      dataRows.forEach(cells => {
        const rowObj = {};
        header.forEach((h, i) => { rowObj[h] = cells[i] !== undefined ? cells[i] : ''; });
        if (!rowObj.name || !rowObj.name.trim()) return;

        const existing = rowObj.id ? existingIds.get(rowObj.id.trim()) : null;
        const parsed = rowToRestaurant(rowObj, existing);
        parsedList.push(parsed);

        if (existing) {
          Object.assign(existing, parsed);
          updated++;
        } else {
          state.restaurants.push(parsed);
          added++;
        }
      });

      saveRestaurants();
      if (USE_API) apiBulk(parsedList).then(() => showToast('Synced to server ✓'));
      renderList();
      showToast(`Imported: ${added} added, ${updated} updated`);
    } catch (err) {
      showToast('Import failed — invalid CSV format');
    }
  };
  reader.readAsText(file);
};

// ─── Toast ────────────────────────────────────────────────────────────────────

let toastTimer = null;
function showToast(msg) {
  let toast = document.getElementById('ok-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ok-toast';
    toast.style.cssText = `
      position:fixed;bottom:calc(var(--safe-bottom) + 88px);left:50%;transform:translateX(-50%);
      background:rgba(30,30,30,0.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      color:white;padding:10px 20px;border-radius:100px;font-size:14px;font-weight:500;
      z-index:300;white-space:nowrap;max-width:90vw;box-shadow:0 4px 16px rgba(0,0,0,0.25);
      transition:opacity 0.25s ease;font-family:inherit;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2400);
}

function shakeEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  requestAnimationFrame(() => {
    el.style.animation = 'shake 0.35s ease';
  });
}

// ─── Service Worker ───────────────────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const discoverEl = document.getElementById('page-discover');
  discoverEl.innerHTML = `
    <div style="padding:80px 20px;text-align:center;">
      <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#000;margin-bottom:4px;">${APP_NAME}</div>
      <div style="font-size:14px;color:#8E8E93;margin-bottom:8px;">${APP_TAGLINE}</div>
      <div style="font-size:14px;color:#8E8E93;">Loading your list…</div>
    </div>`;

  if (USE_API) {
    const rows = await apiCall(API_BASE);
    if (rows && rows.length > 0) {
      state.restaurants = rows;
      saveRestaurants();
    } else if (rows && rows.length === 0) {
      state.restaurants = JSON.parse(JSON.stringify(SEED_RESTAURANTS));
      saveRestaurants();
      await apiBulk(state.restaurants);
    } else {
      state.restaurants = loadRestaurantsLocal();
    }
  } else {
    state.restaurants = loadRestaurantsLocal();
    const sheetUrl = getSheetUrl();
    if (state.restaurants.length === 0 && sheetUrl) {
      const result = await syncRestaurantsFromSheetUrl(sheetUrl);
      if (result.restaurants) {
        state.restaurants = result.restaurants;
        saveRestaurants();
        localStorage.setItem(SHEET_SYNC_KEY, String(Date.now()));
      }
    }
  }

  applyGeoCacheToRestaurants();
  renderDiscover();
}

init();
