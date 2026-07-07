# Pick A Spot

*Where do you wanna eat?*

Dreaded question right? Pick A Spot is a **Progressive Web App** for restaurant recommendations — installable on your home screen, with an iOS-inspired interface and no app store required. Filter your list, get scored picks, log visits, and sync everything from a Google Sheet you control.

Static PWA on GitHub Pages — no server required. Your Google Sheet is the database.

## What it does

- **Discover** — filter by location, drive-time bucket, tags, and reasons; tap **Find Food** for three scored picks shown as rich cards (tier, tags, drive time, score).
- **Map** — pin every restaurant with an address; draw a rectangle to limit Discover picks to that area.
- **History** — visit log with food / vibe / service ratings and notes.
- **List** — browse and manage your restaurants
- **Settings** — Google Sheet sync, write-back, import/export
- **PWA** — add to your home screen for a standalone, full-screen experience (`manifest.json` + service worker).

Data lives in your **Google Sheet** (with optional write-back) and is cached in the browser on each device.

## Scoring method

When you tap **Find Food**, the app:

1. **Filters** restaurants matching your active filters (all selected tags and reasons must match; optional map-area filter applies too).
2. **Scores** each remaining restaurant (see table below).
3. **Ranks** by score descending and keeps the **top 10**.
4. **Picks 3** at random from that top 10. **Spin Again** reshuffles within the same top 10 without re-scoring.

Scores appear on result cards and in restaurant details. Color bands: green (7+), blue (4–6), orange (0–3), red (negative).

| Factor | Points | Condition |
|--------|--------|-----------|
| Never visited | **+5** | No `lastVisited` date |
| Saved a while ago | **+3** | `dateSaved` more than 180 days ago |
| Favorite | **+3** | `Favorite` in the `reasons` column |
| Acclaim / Awards | **+2** | `Acclaim / Awards` in `reasons` |
| Recently visited | **−5** | `lastVisited` within the last 90 days |

**Example:** A never-visited favorite saved over six months ago scores **+11** (5 + 3 + 3). A favorite you ate at last month scores **−2** (3 − 5).

Tier is shown on cards and used to group **List**; it does not add to the score. Drive-time buckets (`In-town`, `Short Drive`, etc.) are filters only, filled by Apps Script from your home address.

Implementation: [`scoreRestaurant()`](artifacts/ok-eats/src/app.js) and [`findRecommendations()`](artifacts/ok-eats/src/app.js) in `artifacts/ok-eats/src/app.js`.

## Live demo

[https://eeeeelizzzzz.github.io/PickASpot-App/](https://eeeeelizzzzz.github.io/PickASpot-App/)

## Use the demo app with your sheet

You do **not** need to fork this repo or deploy your own app if you only want your own restaurant list.

1. **Create a Google Sheet** — import the [example CSV](scripts/google-sheets/example-restaurants.csv) and install [Apps Script](scripts/google-sheets/SETUP.md) (full steps in the [setup guide](scripts/google-sheets/SETUP.md)).
2. **Open the [demo app](https://eeeeelizzzzz.github.io/PickASpot-App/)** on any device.
3. In **Settings**, paste **your** sheet link → **Save Link** → **Sync Now**.
4. Optional: paste your Apps Script **Web app URL** and **Config!B2** secret under **Sheet write-back** so visits and new restaurants save back to the sheet.

Your data lives in **your** Google Sheet. Pick A Spot is just a client — sheet link and write-back settings are stored in the browser on each device, not in this repo.

To host your own copy of the app (custom URL, branding), see [Run your own Pick A Spot](#run-your-own-pick-a-spot) below.

---

## Quick start (your own sheet, our demo app)

1. **Create a sheet** — import [`scripts/google-sheets/example-restaurants.csv`](scripts/google-sheets/example-restaurants.csv) into [Google Sheets](https://sheets.google.com). Full steps: [**Sheet setup guide**](scripts/google-sheets/SETUP.md).
2. **Install Apps Script** — paste [`scripts/google-sheets/PickASpotDriveTimes.gs`](scripts/google-sheets/PickASpotDriveTimes.gs) into **Extensions → Apps Script** on that spreadsheet.
3. In the sheet: **Pick A Spot → Set up Config sheet**, set home address in **Config!B1**, run **Look up missing addresses** and **Update all drive times**.
4. **Share** the sheet: *Anyone with the link can view*.
5. Open the [demo app](https://eeeeelizzzzz.github.io/PickASpot-App/) → **Settings** → paste sheet link → **Sync Now**.
6. Optional write-back: [deploy the script as a Web app](scripts/google-sheets/SETUP.md#deploy-write-back-web-app), then paste URL + **Config!B2** secret under **Sheet write-back**.

---

## Example template sheet

| Method | Link |
|--------|------|
| **Import CSV** (always available) | [`scripts/google-sheets/example-restaurants.csv`](scripts/google-sheets/example-restaurants.csv) |
| **Copy published template** | *Maintainer: add a “Make a copy” Google Sheets link here after publishing your template* |

To publish a template for others: build a sheet from the CSV + Apps Script, share as *Anyone with the link can view*, and add the URL above.

---

## Run your own Pick A Spot

Fork this repo to host your own branded copy on GitHub Pages.

### 1. Fork and enable Pages

1. **Fork** this repository on GitHub.
2. **Settings → Pages → Build and deployment → Source**: **GitHub Actions**.
3. Push to `main` (or run the **Deploy to GitHub Pages** workflow).  
   The workflow sets `BASE_PATH` from your repo name automatically.

Your app will be at:

`https://<your-username>.github.io/<your-repo-name>/`

> If the repo is named `<username>.github.io`, change `BASE_PATH` in [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) to `/` instead of `/<repo-name>/`.

### 2. Create your Google Sheet

Follow [**scripts/google-sheets/SETUP.md**](scripts/google-sheets/SETUP.md) — import the example CSV, paste `PickASpotDriveTimes.gs`, configure **Config**.

### 3. Connect your deployed app

On **your** GitHub Pages URL → **Settings**:

- Sheet link (read sync)
- Web app URL + write secret (optional write-back)

Each user’s sheet link and write-back settings are stored in the browser, not in the repo.

### Local development

```bash
pnpm install
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/ok-eats run dev
```

Open `http://localhost:5173`.

---

## Google Sheet reference

### Column headers (row 1)

```
id, name, location, tier, tags, reasons, address, distance, driveTimeMin, dateSaved, lastVisited, food, vibe, service, parking, cost, notes
```

- `tags` / `reasons` — separate multiple values with `;`
- `driveTimeMin` / `distance` — filled by Apps Script (see below)

### Drive time labels (Apps Script)

| Label | Rule |
|-------|------|
| In-town | Within Norman city limits |
| Short Drive | Under 35 minutes |
| Longer Drive | 35–65 minutes |
| Destination | Over 65 minutes |

### Sheet menu (after installing Apps Script)

- **Look up missing addresses** — geocode from name + location
- **Update all drive times** — from **Config!B1** home address
- **Set up Config sheet** — home address + write secret
- **Show write-back setup** — deploy Web app for app → sheet saves

### App ↔ sheet sync

| Direction | How |
|-----------|-----|
| Sheet → app | **Sync Now** (reads public CSV export) |
| App → sheet | **Sheet write-back** — [Web app deployment](scripts/google-sheets/SETUP.md#deploy-write-back-web-app) + **Config!B2** |

---

## Using the app

See [What it does](#what-it-does) and [Scoring method](#scoring-method) above for how picks work. In the app:

- **Discover** — filters + scored picks
- **Map** — pins; draw a rectangle to limit picks to an area
- **History** — visit log
- **List** — your restaurants
- **Settings** — sync, write-back, import/export
- **How To** — in-app guide

---

## Project structure

| Path | Purpose |
|------|---------|
| [`artifacts/ok-eats/`](artifacts/ok-eats/) | Production PWA |
| [`scripts/google-sheets/`](scripts/google-sheets/) | Example CSV, Apps Script, setup guide |
| [`artifacts/api-server/`](artifacts/api-server/) | Optional Express API (not deployed) |

---

## License

MIT — use, fork, and adapt for your own city or sheet.
