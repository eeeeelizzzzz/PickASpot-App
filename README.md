# Pick A Spot

*Where do you wanna eat?*

Pick A Spot is a **Progressive Web App** for restaurant recommendations — installable on your home screen, iOS-inspired UI, no app store — just a static PWA on GitHub Pages. No server required. Filter your list, get scored picks, log visits, and manage everything from a [**Google Sheet you control**](#google-sheet-setup) (_recommended_) or [**in the browser only**](#local-data-only).

**Live app:** [eeeeelizzzzz.github.io/PickASpot-App](https://eeeeelizzzzz.github.io/PickASpot-App/)  

**New here?** [Getting started](#getting-started) · [What it does](#what-it-does)

---

## About

Hi — I'm [Elizabeth Smith](https://eeeeelizzzzz.github.io/). I built Pick A Spot to escape the eternal "where do you wanna eat?" / "I don't know" loop. My partner and I live in the OKC metro, love trying new places, and needed a way to remember them when hunger (hanger) strikes.

I started the first version on [Replit](https://replit.com/) from my phone, in my pool. Later I used [Cursor](https://cursor.com/) to flesh out sheet sync, the map, save-to-sheet, and more. Read more in the app's **About** tab. Ready to try it? See [Getting started](#getting-started). Issues and contributions welcome! 

---

## What it does

| Tab | What you do |
|-----|-------------|
| **Discover** | Filter by [location, drive-time bucket](#drive-time-labels-from-apps-script), tags, and reasons → **Find Food** for three [scored](#scoring) picks |
| **Map** | See pins for restaurants with addresses; draw a rectangle to limit Discover to that area |
| **History** | Log visits with food / vibe / service ratings and notes |
| **List** | Browse, search, add, and manage restaurants |
| **About** | Why Pick A Spot exists |
| **Settings** | [Google Sheet sync](#how-sync-works), [save to sheet](#how-sync-works), import/export — see [Google Sheet setup](#google-sheet-setup) |
| **How To** | In-app setup guide (or this README's [Getting started](#getting-started)) |

Add to your home screen for a standalone PWA (`manifest.json` + service worker).

### How picks work (short version)

**Find Food** filters your list, scores what matches, keeps the **top 10**, and picks **3** at random. **Spin Again** draws a new random **3** from that same top 10 — without re-filtering or re-scoring. Favorites and places you have not visited lately score higher; recently visited spots score lower. See [Scoring](#scoring) for the full rules and point table.

---

## Getting started

You do **not** have to fork this repo to use the app. Open the [live app](https://eeeeelizzzzz.github.io/PickASpot-App/) and choose a path:

### Recommended: Google Sheet

Best if you want one list across devices (or users) and a spreadsheet you can edit directly. Technical details: [Google Sheet setup](#google-sheet-setup) · [How sync works](#how-sync-works)

1. **Set up a sheet** — copy the [template sheet](https://docs.google.com/spreadsheets/d/1pfqR5V4FRgvMyLmPOguxkgPgFG10zJJazSDfuozXkSM/edit?usp=sharing) (**File → Make a copy**), or import [`example-restaurants.csv`](scripts/google-sheets/example-restaurants.csv), install [`PickASpotDriveTimes.gs`](scripts/google-sheets/PickASpotDriveTimes.gs), configure drive times. Full walkthrough: [**scripts/google-sheets/SETUP.md**](scripts/google-sheets/SETUP.md) (or the [summary checklist](#google-sheet-setup) below).
2. **Pull into Pick A Spot** — **Settings** → paste your sheet link → **Save Link** → **Sync Now**. See [How sync works → Sheet → app](#how-sync-works).
3. **Save back to the sheet** — **Settings → Save to Google Sheet** → paste your Apps Script Web app URL and **Config!B2** secret ([deploy instructions](scripts/google-sheets/SETUP.md#deploy-write-back-web-app)). New restaurants and visit logs then push to the sheet when you save in the app. See [How sync works → App → sheet](#how-sync-works).

Your sheet is the source of truth; Pick A Spot keeps a [local copy](#how-sync-works) in the browser. Sheet link and save settings stay on each device only — nothing about your setup is stored in this repo.

### Alternative: browser only

Skip Google Sheets. **List → Add Restaurant** or **Import** JSON/CSV. Data lives in **local storage** on that device only. Use **Export** to back up or move data. You can add a sheet later. Details: [Local data only](#local-data-only).

### Host your own copy

Fork and deploy on GitHub Pages, or run locally — see [Run your own Pick A Spot](#run-your-own-pick-a-spot).

---

## Google Sheet setup

*← Back to [Getting started → Recommended](#recommended-google-sheet)*

Step-by-step guide: [**scripts/google-sheets/SETUP.md**](scripts/google-sheets/SETUP.md). Summary:

1. Import [`example-restaurants.csv`](scripts/google-sheets/example-restaurants.csv) into [Google Sheets](https://sheets.google.com).
2. Paste [`PickASpotDriveTimes.gs`](scripts/google-sheets/PickASpotDriveTimes.gs) into **Extensions → Apps Script**.
3. **Pick A Spot → Set up Config sheet** → set home address in **Config!B1**.
4. **Look up missing addresses** → **Update all drive times**.
5. **Share** the sheet: *Anyone with the link can view*.
6. In Pick A Spot **Settings**: connect sheet link (**Sync Now**) and **Save to Google Sheet** (Apps Script Web app + **Config!B2**).

| Method | Link |
|--------|------|
| **Import CSV** | [`scripts/google-sheets/example-restaurants.csv`](scripts/google-sheets/example-restaurants.csv) |
| **Copy template sheet** | [Pick A Spot template](https://docs.google.com/spreadsheets/d/1pfqR5V4FRgvMyLmPOguxkgPgFG10zJJazSDfuozXkSM/edit?usp=sharing) — open → **File → Make a copy** |

### How sync works

*← [Getting started](#getting-started) · [Local data only](#local-data-only) (no sheet)*

Pick A Spot always works from a **local copy** in the browser. Sync moves data between that copy and your sheet — there is no background polling.

| Direction | What moves | How | Tap Sync Now? |
|-----------|------------|-----|---------------|
| **Sheet → app** | Restaurant list, drive times, sheet edits | **Sync Now** | **Yes** — after you edit the sheet |
| **App → sheet** | New restaurants, visit logs, ratings, `notes` | **Save to Google Sheet** | **No** — saves when you add or log a visit |

- **Sheet → app:** Changes in Google Sheets do not appear until you tap **Sync Now**. Exception: on first load, if the local list is empty and a sheet link is saved, the app pulls once automatically.
- **App → sheet:** Requires **Save to Google Sheet** (Apps Script Web app + **Config!B2**). **Sync Now never writes to the sheet.** Without save-to-sheet, export from Pick A Spot and paste into the sheet by hand.

### Sheet reference

*Used by [Discover](#what-it-does) filters and [Scoring](#scoring) (`reasons`, `lastVisited`, etc.)*

**Column headers (row 1):**

```
id, name, location, tier, tags, reasons, address, distance, driveTimeMin, dateSaved, lastVisited, food, vibe, service, parking, cost, notes
```

- **`id`** — stable row ID used to match the same restaurant across sync and save-back. You can set your own (e.g. `r001`) or leave blank and let the app assign one automatically (e.g. `r1730912345k7x2`) when you add a row or sync. Keep IDs stable once a place exists in both the sheet and the app.
- `tags` / `reasons` — separate multiple values with `;`
- `driveTimeMin` / `distance` — filled by Apps Script from **Config!B1** (not computed in [local data only](#local-data-only) mode)

**Drive-time labels** (computed in Google Sheets by Apps Script — not in [local data only](#local-data-only) mode):

<a id="drive-time-labels-from-apps-script"></a>

| Label | Rule |
|-------|------|
| In-town | Within Norman city limits |
| Short Drive | Under 35 minutes |
| Longer Drive | 35–65 minutes |
| Destination | Over 65 minutes |

**Spreadsheet menu** (after installing Apps Script):

- **Look up missing addresses** — geocode from name + location (multi-location chains need a manual address)
- **Update all drive times** — from **Config!B1** home address
- **Set up Config sheet** — home address + write secret (**Config!B2**)
- **Show write-back setup** — reminder for deploying the Apps Script Web app

---

## Local data only

*← Back to [Getting started → Alternative](#alternative-browser-only)*

Use Pick A Spot without any Google account or sheet:

- Add restaurants on **List**, log visits on **History**, pick on **Discover** — all from data in **local storage** on that browser/device.
- Nothing syncs to other phones, tablets, or computers automatically.
- **No sheet-side automation** — drive times, distance labels, and address geocoding from Apps Script are not available. Enter `distance`, `driveTimeMin`, and `address` yourself if you use those filters or the map.
- **Export** JSON or CSV to back up; **Import** on another device to restore.
- To switch to a sheet later: export CSV, import into Google Sheets, then follow [Google Sheet setup](#google-sheet-setup) (or [Getting started → Recommended](#recommended-google-sheet)).

Sheet link and save settings (if you add them later) are stored in the browser on each device, not in this repo or on any Pick A Spot server. See also [How sync works](#how-sync-works).

---

## Scoring

*← Back to [What it does → How picks work](#how-picks-work-short-version)*

When you tap **Find Food**:

1. **Filter** — restaurants must match all selected tags and reasons; optional map-area filter applies.
2. **Score** — each match gets points (table below).
3. **Rank** — sort by score, keep the **top 10**.
4. **Pick 3** — random sample of **3** from that top 10. **Spin Again** draws a new random **3** from the same top 10 without re-filtering or re-scoring.

Scores show on result cards. Color bands: green (7+), blue (4–6), orange (0–3), red (negative).

| Factor | Points | Condition |
|--------|--------|-----------|
| Never visited | **+5** | No `lastVisited` date |
| Saved a while ago | **+3** | `dateSaved` more than 180 days ago |
| Favorite | **+3** | `Favorite` in the `reasons` column |
| Acclaim / Awards | **+2** | `Acclaim / Awards` in `reasons` |
| Recently visited | **−5** | `lastVisited` within the last 90 days |

**Examples:** A never-visited favorite saved over six months ago → **+11** (5 + 3 + 3). A favorite visited last month → **−2** (3 − 5).

**Tier** groups the **List** and appears on cards; it does not affect the score. **Drive-time buckets** ([`In-town`, `Short Drive`, etc.](#drive-time-labels-from-apps-script)) are filters only, filled by Apps Script — see [Sheet reference](#sheet-reference).

Implementation: [`scoreRestaurant()`](artifacts/ok-eats/src/app.js) and [`findRecommendations()`](artifacts/ok-eats/src/app.js). App tabs: [What it does](#what-it-does).

---

## Run your own Pick A Spot

*← Back to [Getting started → Host your own copy](#host-your-own-copy)*

Fork this repo to host it yourself or develop locally. For using the official app with your own data instead, see [Getting started](#getting-started) — no fork required.

### Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js 24+** | Matches [CI](.github/workflows/deploy-pages.yml) |
| **pnpm 9.15.9** | Required — `corepack enable` then `corepack prepare pnpm@9.15.9 --activate` |
| **Static hosting** | Production is static files only — no Node server at runtime |

**Optional at runtime** (features still work without these, with limits):

- **Google Sheets + Apps Script** — [recommended data path](#google-sheet-setup)
- **OpenStreetMap** — map tiles on the **Map** tab
- **Photon / OSRM** (public APIs) — only if you use **Settings → Update Drive Times** without the sheet script; [local data only](#local-data-only) has no drive-time automation

### Local development

```bash
pnpm install
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/ok-eats run build   # production build
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/ok-eats run dev      # dev server
```

Open `http://localhost:5173`. For a subpath deploy (e.g. GitHub Pages), set `BASE_PATH` to `/<repo-name>/` when building — same as CI.

> **Note:** The steps below are for deploying on **GitHub Pages**. Other hosts (Netlify, Cloudflare Pages, your own server, etc.) work too — build with the correct `BASE_PATH` and serve `artifacts/ok-eats/dist/public`.

### GitHub Pages

1. **Fork** on GitHub.
2. **Settings → Pages → Build and deployment → Source**: **GitHub Actions**.
3. Push to `main` (or run **Deploy to GitHub Pages**). `BASE_PATH` is set from your repo name automatically.

App URL: `https://<username>.github.io/<repo-name>/`

> Repo named `<username>.github.io`? Set `BASE_PATH` to `/` in [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

Then choose [Google Sheet setup](#google-sheet-setup) (connect in **Settings** on your deployed URL) or [local data only](#local-data-only) (no sheet setup required).

---

## Project structure

| Path | Purpose |
|------|---------|
| [`artifacts/ok-eats/`](artifacts/ok-eats/) | Production PWA |
| [`scripts/google-sheets/`](scripts/google-sheets/) | Example CSV, Apps Script, setup guide |
| [`artifacts/api-server/`](artifacts/api-server/) | Optional Express API (not used in production) |

---

## License

MIT — use, fork, and adapt for your own city, data, and preferences.
