// ─── Data & Constants ────────────────────────────────────────────────────────

const STORAGE_KEY = 'ok_eats_restaurants_v2';

const TIERS = [
  'Tier 1 - Never Skip',
  'Tier 2 - The New Guard',
  'Tier 3 - Stellar Classics',
  'The Fun Category',
];

const LOCATIONS = ['OKC', 'Norman', 'Edmond', 'Yukon', 'Guthrie', 'Tulsa', 'Stillwater', 'Midwest City'];
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

const ALL_TAGS = [
  'Fine Dining', 'Chef Driven', 'International', 'Patio',
  'Great Cocktails', 'Brunch', 'Worth the Drive', 'Tasting Menu',
  'Seasonal Menu', 'Hidden Gem', 'Date Night', 'Casual',
  'Seafood', 'Steakhouse', 'BBQ', 'Farm to Table', 'Late Night',
  'Outdoor Dining', 'Local Favorite', 'Vegetarian Friendly',
  'Takeout / Delivery',
];

const TIER_COLORS = {
  'Tier 1 - Never Skip':   { bg: '#FFF3E0', text: '#E65100', dot: '#FF9500' },
  'Tier 2 - The New Guard':{ bg: '#E3F2FD', text: '#0D47A1', dot: '#007AFF' },
  'Tier 3 - Stellar Classics':{ bg: '#F3E5F5', text: '#4A148C', dot: '#AF52DE' },
  'The Fun Category':      { bg: '#E8F5E9', text: '#1B5E20', dot: '#34C759' },
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

const SEED_RESTAURANTS = [
  {
    id: 'r1',
    name: 'Nonesuch',
    location: 'OKC',
    tier: 'Tier 1 - Never Skip',
    tags: ['Fine Dining', 'Chef Driven', 'Tasting Menu', 'Seasonal Menu', 'Date Night'],
    acclaimed: true,
    dateSaved: '2023-08-15',
    lastVisited: null,
    bestSeasons: ['Fall', 'Winter'],
  },
  {
    id: 'r2',
    name: 'Later Bye',
    location: 'OKC',
    tier: 'Tier 2 - The New Guard',
    tags: ['Great Cocktails', 'Chef Driven', 'Date Night', 'Late Night'],
    acclaimed: true,
    dateSaved: '2023-11-20',
    lastVisited: '2024-12-01',
    bestSeasons: ['Fall', 'Winter', 'Spring'],
  },
  {
    id: 'r3',
    name: "Sedalia's Oyster & Seafood",
    location: 'OKC',
    tier: 'Tier 1 - Never Skip',
    tags: ['Seafood', 'Chef Driven', 'Patio', 'Fine Dining', 'Date Night'],
    acclaimed: true,
    dateSaved: '2023-09-10',
    lastVisited: null,
    bestSeasons: ['Summer', 'Spring'],
  },
  {
    id: 'r4',
    name: 'Magic Noodle',
    location: 'Norman',
    tier: 'The Fun Category',
    tags: ['International', 'Casual', 'Local Favorite', 'Vegetarian Friendly'],
    acclaimed: false,
    dateSaved: '2024-01-05',
    lastVisited: '2024-11-15',
    bestSeasons: ['Fall', 'Winter', 'Spring', 'Summer'],
  },
  {
    id: 'r5',
    name: 'Plus254',
    location: 'OKC',
    tier: 'The Fun Category',
    tags: ['International', 'Hidden Gem', 'Casual', 'Local Favorite'],
    acclaimed: false,
    dateSaved: '2024-02-14',
    lastVisited: null,
    bestSeasons: ['Spring', 'Summer', 'Fall', 'Winter'],
  },
  {
    id: 'r6',
    name: 'Sunnyside Diner',
    location: 'OKC',
    tier: 'Tier 3 - Stellar Classics',
    tags: ['Brunch', 'Local Favorite', 'Casual', 'Outdoor Dining'],
    acclaimed: false,
    dateSaved: '2023-06-01',
    lastVisited: '2024-09-20',
    bestSeasons: ['Spring', 'Summer'],
  },
  {
    id: 'r7',
    name: 'Vast',
    location: 'OKC',
    tier: 'Tier 1 - Never Skip',
    tags: ['Fine Dining', 'Date Night', 'Steakhouse', 'Great Cocktails'],
    acclaimed: true,
    dateSaved: '2023-05-12',
    lastVisited: '2024-06-15',
    bestSeasons: ['Fall', 'Winter', 'Spring'],
  },
  {
    id: 'r8',
    name: 'The Hutch',
    location: 'OKC',
    tier: 'Tier 2 - The New Guard',
    tags: ['Great Cocktails', 'Seasonal Menu', 'Date Night', 'Patio'],
    acclaimed: false,
    dateSaved: '2024-01-20',
    lastVisited: null,
    bestSeasons: ['Spring', 'Summer', 'Fall'],
  },
  {
    id: 'r9',
    name: "Ludivine",
    location: 'OKC',
    tier: 'Tier 1 - Never Skip',
    tags: ['Chef Driven', 'Farm to Table', 'Seasonal Menu', 'Fine Dining', 'Date Night'],
    acclaimed: true,
    dateSaved: '2023-04-28',
    lastVisited: '2024-03-10',
    bestSeasons: ['Spring', 'Summer', 'Fall'],
  },
  {
    id: 'r10',
    name: "Provision Kitchen",
    location: 'Edmond',
    tier: 'Tier 2 - The New Guard',
    tags: ['Farm to Table', 'Brunch', 'Seasonal Menu', 'Patio'],
    acclaimed: false,
    dateSaved: '2024-03-01',
    lastVisited: null,
    bestSeasons: ['Spring', 'Summer'],
  },
  {
    id: 'r11',
    name: "Musashi's",
    location: 'OKC',
    tier: 'Tier 3 - Stellar Classics',
    tags: ['International', 'Local Favorite', 'Casual', 'Date Night'],
    acclaimed: false,
    dateSaved: '2023-07-19',
    lastVisited: '2024-08-05',
    bestSeasons: ['Fall', 'Winter', 'Spring', 'Summer'],
  },
  {
    id: 'r12',
    name: "The Jones Assembly",
    location: 'OKC',
    tier: 'Tier 2 - The New Guard',
    tags: ['Great Cocktails', 'Patio', 'Late Night', 'Brunch', 'Outdoor Dining'],
    acclaimed: false,
    dateSaved: '2023-10-05',
    lastVisited: '2024-05-30',
    bestSeasons: ['Spring', 'Summer', 'Fall'],
  },
  {
    id: 'r13',
    name: "Prairie Thunder Bakehouse",
    location: 'Guthrie',
    tier: 'Tier 3 - Stellar Classics',
    tags: ['Brunch', 'Worth the Drive', 'Local Favorite', 'Casual'],
    acclaimed: false,
    dateSaved: '2024-04-10',
    lastVisited: null,
    bestSeasons: ['Spring', 'Summer'],
  },
  {
    id: 'r14',
    name: "Arnie's Bar-B-Q",
    location: 'OKC',
    tier: 'Tier 3 - Stellar Classics',
    tags: ['BBQ', 'Local Favorite', 'Casual', 'Outdoor Dining'],
    acclaimed: false,
    dateSaved: '2023-08-22',
    lastVisited: '2024-07-04',
    bestSeasons: ['Summer', 'Spring', 'Fall'],
  },
  {
    id: 'r15',
    name: "Ponyboy",
    location: 'OKC',
    tier: 'Tier 2 - The New Guard',
    tags: ['Great Cocktails', 'Chef Driven', 'Late Night', 'Casual'],
    acclaimed: true,
    dateSaved: '2024-05-01',
    lastVisited: null,
    bestSeasons: ['Fall', 'Winter', 'Spring'],
  },
  {
    id: 'r16',
    name: "Indian Hills Steakhouse",
    location: 'Yukon',
    tier: 'Tier 3 - Stellar Classics',
    tags: ['Steakhouse', 'Worth the Drive', 'Local Favorite', 'Date Night'],
    acclaimed: false,
    dateSaved: '2023-12-01',
    lastVisited: '2024-02-14',
    bestSeasons: ['Winter', 'Fall'],
  },
  {
    id: 'r17',
    name: "Duet Restaurant & Bar",
    location: 'Norman',
    tier: 'Tier 2 - The New Guard',
    tags: ['Chef Driven', 'Great Cocktails', 'Date Night', 'Seasonal Menu'],
    acclaimed: false,
    dateSaved: '2024-06-15',
    lastVisited: null,
    bestSeasons: ['Fall', 'Winter', 'Spring'],
  },
  {
    id: 'r18',
    name: "Fassler Hall",
    location: 'OKC',
    tier: 'The Fun Category',
    tags: ['Great Cocktails', 'Patio', 'Outdoor Dining', 'Casual', 'Late Night'],
    acclaimed: false,
    dateSaved: '2023-09-30',
    lastVisited: '2024-10-12',
    bestSeasons: ['Spring', 'Summer', 'Fall'],
  },
  {
    id: 'r19',
    name: "Smoke on the Hill",
    location: 'Edmond',
    tier: 'The Fun Category',
    tags: ['BBQ', 'Casual', 'Local Favorite', 'Outdoor Dining'],
    acclaimed: false,
    dateSaved: '2024-07-20',
    lastVisited: null,
    bestSeasons: ['Summer', 'Spring'],
  },
  {
    id: 'r20',
    name: "Cafe do Brasil",
    location: 'OKC',
    tier: 'Tier 3 - Stellar Classics',
    tags: ['International', 'Brunch', 'Casual', 'Local Favorite'],
    acclaimed: false,
    dateSaved: '2023-11-15',
    lastVisited: '2024-04-20',
    bestSeasons: ['Spring', 'Summer', 'Fall', 'Winter'],
  },
  {
    id: 'r21',
    name: "El Fogon",
    location: 'OKC',
    tier: 'The Fun Category',
    tags: ['International', 'Hidden Gem', 'Casual', 'Local Favorite'],
    acclaimed: false,
    dateSaved: '2024-03-25',
    lastVisited: null,
    bestSeasons: ['Spring', 'Summer', 'Fall', 'Winter'],
  },
  {
    id: 'r22',
    name: "CIDOR",
    location: 'OKC',
    tier: 'Tier 2 - The New Guard',
    tags: ['Fine Dining', 'Chef Driven', 'Date Night', 'Great Cocktails'],
    acclaimed: true,
    dateSaved: '2024-08-10',
    lastVisited: null,
    bestSeasons: ['Fall', 'Winter'],
  },
  {
    id: 'r23',
    name: "Sisserou's",
    location: 'OKC',
    tier: 'Tier 3 - Stellar Classics',
    tags: ['International', 'Great Cocktails', 'Patio', 'Date Night'],
    acclaimed: false,
    dateSaved: '2024-02-05',
    lastVisited: '2024-11-01',
    bestSeasons: ['Summer', 'Spring', 'Fall'],
  },
  {
    id: 'r24',
    name: "Kitchen No. 324",
    location: 'OKC',
    tier: 'Tier 3 - Stellar Classics',
    tags: ['Brunch', 'Seasonal Menu', 'Outdoor Dining', 'Date Night'],
    acclaimed: false,
    dateSaved: '2023-06-10',
    lastVisited: '2024-09-08',
    bestSeasons: ['Spring', 'Summer'],
  },
  {
    id: 'r25',
    name: "Goro Ramen",
    location: 'OKC',
    tier: 'The Fun Category',
    tags: ['International', 'Casual', 'Local Favorite', 'Late Night'],
    acclaimed: false,
    dateSaved: '2024-01-12',
    lastVisited: null,
    bestSeasons: ['Fall', 'Winter', 'Spring'],
  },
];

// ─── State ────────────────────────────────────────────────────────────────────

let state = {
  tab: 'discover',
  restaurants: [],
  filters: {
    locations: [],
    tags: [],
    season: '',
  },
  results: null,
  top10Pool: null,
  listSearch: '',
  expandedFilters: false,
};

function loadRestaurants() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return JSON.parse(JSON.stringify(SEED_RESTAURANTS));
}

function saveRestaurants() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.restaurants));
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

function scoreRestaurant(r, season) {
  const t = today();
  let score = 0;
  // +5 never visited
  if (!r.lastVisited) score += 5;
  // +3 saved over 6 months
  if (daysBetween(r.dateSaved, t) > 180) score += 3;
  // +2 acclaimed
  if (r.acclaimed) score += 2;
  // +2 season match
  if (season && r.bestSeasons && r.bestSeasons.includes(season)) score += 2;
  // -5 visited in last 90 days
  if (r.lastVisited && daysBetween(r.lastVisited, t) < 90) score -= 5;
  return score;
}

function findRecommendations() {
  const { locations, tags, season } = state.filters;
  let pool = state.restaurants.slice();

  // Filter
  if (locations.length > 0) {
    pool = pool.filter(r => locations.includes(r.location));
  }
  if (tags.length > 0) {
    pool = pool.filter(r => tags.every(tag => r.tags.includes(tag)));
  }

  // Score
  pool = pool.map(r => ({ ...r, _score: scoreRestaurant(r, season) }));

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

  const tagPills = ALL_TAGS.map(tag => {
    const on = filters.tags.includes(tag);
    return `<button class="pill ${on ? 'pill-on' : 'pill-off'}" onclick="toggleTag('${escHtml(tag)}')">${escHtml(tag)}</button>`;
  }).join('');

  const seasonOptions = ['<option value="">Any Season</option>', ...SEASONS.map(s =>
    `<option value="${s}" ${filters.season === s ? 'selected' : ''}>${s}</option>`
  )].join('');

  const activeCount = filters.locations.length + filters.tags.length + (filters.season ? 1 : 0);
  const activeLabel = activeCount > 0 ? `<span style="background:#007AFF;color:white;border-radius:100px;padding:0 6px;font-size:11px;font-weight:700;margin-left:4px;">${activeCount}</span>` : '';

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
      <div style="display:flex;align-items:baseline;justify-content:space-between;">
        <div>
          <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#000;line-height:1.1;">OK Eats</div>
          <div style="font-size:14px;color:#8E8E93;margin-top:2px;font-weight:400;">What are you in the mood for?</div>
        </div>
        <div style="font-size:13px;color:#007AFF;font-weight:500;cursor:pointer;" onclick="clearFilters()">Clear all</div>
      </div>
    </div>

    <div style="padding:0 20px 14px;">
      <div class="ios-card" style="padding:16px;">

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:12px;font-weight:700;color:#8E8E93;letter-spacing:0.6px;text-transform:uppercase;">Location ${activeLabel}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px;">
          ${locationPills}
        </div>

        <div style="font-size:12px;font-weight:700;color:#8E8E93;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:10px;">Season</div>
        <select class="ios-select" onchange="setSeason(this.value)" style="margin-bottom:16px;">
          ${seasonOptions}
        </select>

        <div style="font-size:12px;font-weight:700;color:#8E8E93;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:10px;">Tags</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;">
          ${tagPills}
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
  if (filters.tags.length > 0) pool = pool.filter(r => filters.tags.every(tag => r.tags.includes(tag)));
  return pool.length;
}

function renderResultCard(r, index) {
  const tierCfg = TIER_COLORS[r.tier] || { bg: '#F2F2F7', text: '#3C3C43', dot: '#8E8E93' };
  const tagBadges = r.tags.slice(0, 4).map(tag => {
    const c = tagColor(tag);
    return `<span class="badge-tag" style="background:${c.bg};color:${c.text};">${escHtml(tag)}</span>`;
  }).join('');
  const acclaimedBadge = r.acclaimed
    ? `<span class="badge-tag" style="background:#FFF8E1;color:#B25D00;">⭐ Acclaimed</span>`
    : '';
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
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">
          ${acclaimedBadge}
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
  const acclaimedCount = visited.filter(r => r.acclaimed).length;

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
              ${r.acclaimed ? '<span style="color:#FFCC00;font-size:12px;flex-shrink:0;">★</span>' : ''}
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
          <div style="font-size:24px;font-weight:700;color:#FFCC00;letter-spacing:-0.5px;">${acclaimedCount}</div>
          <div style="font-size:11px;color:#8E8E93;font-weight:500;margin-top:2px;">Acclaimed</div>
        </div>
      </div>
    </div>

    <div style="padding:0 20px 32px;">
      ${groupsHtml}
    </div>`;
}

// ─── Render: My List Tab ──────────────────────────────────────────────────────

function renderList() {
  const el = document.getElementById('page-list');
  const search = state.listSearch.toLowerCase();

  let filtered = state.restaurants.filter(r =>
    !search ||
    r.name.toLowerCase().includes(search) ||
    r.location.toLowerCase().includes(search) ||
    r.tags.some(t => t.toLowerCase().includes(search))
  );

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
              ${r.acclaimed ? '<span style="color:#FFCC00;font-size:12px;flex-shrink:0;">★</span>' : ''}
            </div>
            <div style="font-size:12px;color:#8E8E93;">${escHtml(r.location)} · ${visitedText}</div>
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
    groupsHtml = `
      <div class="ios-card" style="margin:0 20px;padding:32px 20px;text-align:center;">
        <div style="font-size:40px;margin-bottom:10px;">🔍</div>
        <div style="font-size:16px;font-weight:600;color:#000;margin-bottom:4px;">No results</div>
        <div style="font-size:13px;color:#8E8E93;">Try a different search term.</div>
      </div>`;
  }

  el.innerHTML = `
    <div style="padding:20px 20px 12px;">
      <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#000;margin-bottom:12px;">My List</div>
      <div class="search-wrap">
        <span style="color:#8E8E93;font-size:15px;">🔍</span>
        <input
          id="list-search"
          type="search"
          placeholder="Search restaurants…"
          value="${escHtml(state.listSearch)}"
          oninput="handleListSearch(this.value)"
        />
        ${state.listSearch ? `<button onclick="handleListSearch('')" style="background:rgba(118,118,128,0.24);border:none;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;font-size:10px;color:#8E8E93;flex-shrink:0;">✕</button>` : ''}
      </div>
    </div>

    <div style="padding:0 20px 12px;display:flex;flex-direction:column;gap:8px;">
      <button onclick="openAddRestaurant()" style="background:white;border:none;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;width:100%;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.07);font-family:inherit;" ontouchstart="">
        <span style="width:28px;height:28px;background:#007AFF;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:17px;color:white;flex-shrink:0;">+</span>
        <div style="text-align:left;">
          <div style="font-size:15px;font-weight:600;color:#000;">Add Restaurant</div>
          <div style="font-size:12px;color:#8E8E93;">Add a new spot to your list</div>
        </div>
      </button>
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
      </div>
    </div>

    <div style="padding:0 20px 32px;">
      ${groupsHtml}
    </div>
  `;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

window.switchTab = function(tab) {
  state.tab = tab;
  state.results = null;
  const pages = ['discover', 'history', 'list'];
  pages.forEach(p => {
    const pg = document.getElementById('page-' + p);
    if (pg) pg.style.display = tab === p ? '' : 'none';
    const lbl = document.getElementById('tab-label-' + p);
    if (lbl) lbl.style.color = tab === p ? '#007AFF' : '#8E8E93';
  });
  if (tab === 'discover') renderDiscover();
  else if (tab === 'history') renderHistory();
  else renderList();
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

window.setSeason = function(val) {
  state.filters.season = val;
  state.results = null;
  renderDiscover();
};

window.clearFilters = function() {
  state.filters = { locations: [], tags: [], season: '' };
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
  state.listSearch = val;
  renderList();
  // Restore focus
  requestAnimationFrame(() => {
    const inp = document.getElementById('list-search');
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
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
  const seasonChecks   = SEASONS.map(s => `
    <label style="display:flex;align-items:center;gap:9px;padding:8px 0;cursor:pointer;font-size:14px;color:#000;">
      <input type="checkbox" name="lv-seasons" value="${escHtml(s)}" style="width:17px;height:17px;accent-color:#007AFF;flex-shrink:0;" />
      ${escHtml(s)}
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
              <label style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:white;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);cursor:pointer;">
                <input id="lv-acclaimed" type="checkbox" style="width:17px;height:17px;accent-color:#007AFF;" />
                <div>
                  <div style="font-size:14px;font-weight:600;color:#000;">Acclaimed ⭐</div>
                  <div style="font-size:11px;color:#8E8E93;">James Beard / critically celebrated</div>
                </div>
              </label>
            </div>
          </div>

          <!-- ── Tags ── -->
          <div>
            <div style="font-size:13px;font-weight:700;color:#000;letter-spacing:-0.1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1.5px solid #F2F2F7;">Tags</div>
            <div class="ios-card" style="padding:0 12px;">${tagCheckboxes}</div>
          </div>

          <!-- ── Best Seasons ── -->
          <div>
            <div style="font-size:13px;font-weight:700;color:#000;letter-spacing:-0.1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1.5px solid #F2F2F7;">Best Seasons</div>
            <div class="ios-card" style="padding:4px 12px;">${seasonChecks}</div>
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

window.submitLogVisit = function() {
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
  const acclaimed   = document.getElementById('lv-acclaimed').checked;
  const lastVisited = document.getElementById('lv-visited').value || today();
  const tags        = [...document.querySelectorAll('input[name="lv-tags"]:checked')].map(e => e.value);
  const bestSeasons = [...document.querySelectorAll('input[name="lv-seasons"]:checked')].map(e => e.value);

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
    acclaimed,
    dateSaved:   today(),
    lastVisited,
    bestSeasons,
    ratings: { food, vibe, service, parking: parking || null, cost: cost || null },
    notes,
  };

  state.restaurants.push(newR);
  saveRestaurants();
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
  const seasonChecks = SEASONS.map(s => `
    <label style="display:flex;align-items:center;gap:8px;padding:8px 0;cursor:pointer;font-size:14px;color:#000;">
      <input type="checkbox" name="seasons" value="${escHtml(s)}" style="width:17px;height:17px;accent-color:#007AFF;" />
      ${escHtml(s)}
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
            <div style="font-size:12px;font-weight:600;color:#8E8E93;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:6px;">Tags</div>
            <div class="ios-card" style="padding:4px 12px;">${tagCheckboxes}</div>
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:12px;font-weight:600;color:#8E8E93;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:6px;">Best Seasons</div>
            <div class="ios-card" style="padding:4px 12px;">${seasonChecks}</div>
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:12px;font-weight:600;color:#8E8E93;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:6px;">Acclaimed</div>
            <label style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:white;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);cursor:pointer;">
              <input id="add-acclaimed" type="checkbox" style="width:17px;height:17px;accent-color:#007AFF;" />
              <span style="font-size:14px;color:#000;">James Beard / Highly Acclaimed</span>
            </label>
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

window.submitAddRestaurant = function() {
  const name = document.getElementById('add-name').value.trim();
  if (!name) { shakeEl('add-name'); return; }
  const location = document.getElementById('add-location').value;
  const tier = document.getElementById('add-tier').value;
  const acclaimed = document.getElementById('add-acclaimed').checked;
  const lastVisited = document.getElementById('add-visited').value || null;
  const tags = [...document.querySelectorAll('input[name="tags"]:checked')].map(el => el.value);
  const bestSeasons = [...document.querySelectorAll('input[name="seasons"]:checked')].map(el => el.value);

  const newR = {
    id: genId(),
    name,
    location,
    tier,
    tags,
    acclaimed,
    dateSaved: today(),
    lastVisited,
    bestSeasons,
  };
  state.restaurants.push(newR);
  saveRestaurants();
  closeModal();
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
  const seasonPills = (r.bestSeasons || []).map(s =>
    `<span class="badge-tag" style="background:#E3F2FD;color:#0D47A1;">${escHtml(s)}</span>`
  ).join('');
  const score = scoreRestaurant(r, state.filters.season);
  const scoreColor = score >= 7 ? '#34C759' : score >= 4 ? '#007AFF' : score >= 0 ? '#FF9500' : '#FF3B30';
  const tierOptionHtml = TIERS.map(t =>
    `<option value="${escHtml(t)}" ${r.tier === t ? 'selected' : ''}>${escHtml(t)}</option>`
  ).join('');
  const locationOptionHtml = LOCATIONS.map(l =>
    `<option value="${escHtml(l)}" ${r.location === l ? 'selected' : ''}>${escHtml(l)}</option>`
  ).join('');

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
              <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">Best Seasons</div>
              <div style="display:flex;flex-wrap:wrap;gap:5px;">${seasonPills || '<span style="font-size:13px;color:#C7C7CC;">Not specified</span>'}</div>
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
            <div style="padding:14px 16px;">
              <div style="font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">Location</div>
              <select id="detail-location" class="ios-select" style="box-shadow:none;padding-left:0;">${locationOptionHtml}</select>
            </div>
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
  closeModal();
  renderList();
  showToast(`Visit date updated!`);
};

window.saveDetailChanges = function(id) {
  const r = state.restaurants.find(r => r.id === id);
  if (!r) return;
  const tier        = document.getElementById('detail-tier').value;
  const location    = document.getElementById('detail-location').value;
  const visitedDate = document.getElementById('detail-visited-date').value;
  if (tier)        r.tier        = tier;
  if (location)    r.location    = location;
  if (visitedDate) r.lastVisited = visitedDate;

  const food    = parseInt(document.getElementById('rev-food')?.value)    || null;
  const vibe    = parseInt(document.getElementById('rev-vibe')?.value)    || null;
  const service = parseInt(document.getElementById('rev-service')?.value) || null;
  const parking = document.getElementById('rev-parking')?.value || null;
  const cost    = document.getElementById('rev-cost')?.value    || null;
  const notes   = (document.getElementById('rev-notes')?.value || '').trim();

  r.ratings = { food, vibe, service, parking: parking || null, cost: cost || null };
  r.notes   = notes;

  saveRestaurants();
  closeModal();
  if (state.tab === 'history') renderHistory();
  else renderList();
  showToast('Changes saved!');
};

window.deleteRestaurant = function(id, name) {
  if (!confirm(`Remove "${name}" from your list?`)) return;
  state.restaurants = state.restaurants.filter(r => r.id !== id);
  saveRestaurants();
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
  a.download = `ok-eats-${today()}.json`;
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
      renderList();
      showToast(`Imported: ${added} added, ${updated} updated`);
    } catch (err) {
      showToast('Import failed — invalid JSON format');
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

state.restaurants = loadRestaurants();
renderDiscover();
