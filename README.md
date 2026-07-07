# Pick A Spot

*Where do you wanna eat?*

Dreaded question right? This tool makes it a little easier by making restaurant recommendations. Filter by location, tags, and tier; get scored picks; log visits; and sync your list from a Google Sheet.

Static PWA on GitHub Pages — no server required. Your Google Sheet is the database. 

## Live demo

[https://eeeeelizzzzz.github.io/PickASpot-App/](https://eeeeelizzzzz.github.io/PickASpot-App/)

## Use the demo app with your sheet

You do **not** need to fork this repo or deploy your own app if you only want your own restaurant list.

1. **Create a Google Sheet** — import the [example CSV](scripts/google-sheets/example-restaurants.csv) and install [Apps Script](scripts/google-sheets/SETUP.md) (full steps in the [setup guide](scripts/google-sheets/SETUP.md)).
2. **Open the [demo app](https://eeeeelizzzzz.github.io/PickASpot-App/)** on any device.
3. In **My List**, paste **your** sheet link → **Save Link** → **Sync Now**.
4. Optional: paste your Apps Script **Web app URL** and **Config!B2** secret under **Sheet write-back** so visits and new restaurants save back to the sheet.

Your data lives in **your** Google Sheet. Pick A Spot is just a client — sheet link and write-back settings are stored in the browser on each device, not in this repo.

To host your own copy of the app (custom URL, branding), see [Run your own Pick A Spot](#run-your-own-pick-a-spot) below.

---

## Quick start (your own sheet, our demo app)

1. **Create a sheet** — import [`scripts/google-sheets/example-restaurants.csv`](scripts/google-sheets/example-restaurants.csv) into [Google Sheets](https://sheets.google.com). Full steps: [**Sheet setup guide**](scripts/google-sheets/SETUP.md).
2. **Install Apps Script** — paste [`scripts/google-sheets/PickASpotDriveTimes.gs`](scripts/google-sheets/PickASpotDriveTimes.gs) into **Extensions → Apps Script** on that spreadsheet.
3. In the sheet: **Pick A Spot → Set up Config sheet**, set home address in **Config!B1**, run **Look up missing addresses** and **Update all drive times**.
4. **Share** the sheet: *Anyone with the link can view*.
5. Open the [demo app](https://eeeeelizzzzz.github.io/PickASpot-App/) → **My List** → paste sheet link → **Sync Now**.
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

On **your** GitHub Pages URL → **My List**:

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

- **Discover** — filters + scored picks
- **Map** — pins; draw a rectangle to limit picks to an area
- **History** — visit log
- **My List** — sync, write-back, import/export
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
