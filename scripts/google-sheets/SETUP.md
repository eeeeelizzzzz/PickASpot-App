# Google Sheet + Apps Script setup

Use this guide to create **your own** Pick A Spot spreadsheet, or to copy the maintainer's template if a link is provided in the root [README](../../README.md).

## Option A — Import the example CSV (recommended)

1. Go to [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**.
2. **File → Import → Upload** → choose [`example-restaurants.csv`](example-restaurants.csv).
3. Import location: **Replace current sheet** (or insert as new sheet named `Restaurants`).
4. Confirm row 1 headers match:

   ```
   id, name, location, tier, tags, reasons, address, distance, driveTimeMin, dateSaved, lastVisited, food, vibe, service, parking, cost, notes
   ```

5. Delete or edit the three sample rows; add your restaurants.
6. Continue with **Install Apps Script** below.

## Option B — Copy a published template sheet

If the project README includes a **“Copy template sheet”** link:

1. Open that link while signed into Google.
2. **File → Make a copy** (saves to your Drive).
3. The copy already includes the Apps Script if the maintainer bundled it — otherwise continue with **Install Apps Script**.

To publish your own template for others (maintainers):

1. Build a sheet from Option A and install the script (steps below).
2. **Share → General access → Anyone with the link → Viewer**.
3. Add the share URL to the README under “Template sheet”.
4. Optional: **File → Share → Publish to web** (for CSV export fallback).

## Install Apps Script

1. Open your spreadsheet → **Extensions → Apps Script**.
2. Delete the contents of `Code.gs`.
3. Paste the full contents of [`PickASpotDriveTimes.gs`](PickASpotDriveTimes.gs) from this repo.
4. **Save** (disk icon). Name the project e.g. `Pick A Spot`.
5. Reload the spreadsheet. You should see menu **Pick A Spot**.

### First-time authorization

- Run **Pick A Spot → Set up Config sheet**.
- Approve permissions when prompted (Google account, spreadsheets, external requests for Maps).
- Enable the **Maps** service if Apps Script asks.

### Config tab

| Cell | Purpose |
|------|---------|
| **Config!B1** | Your home address (for drive times) |
| **Config!B2** | Write secret (for Pick A Spot → sheet saves). Copy into Pick A Spot **Settings → Save to Google Sheet**. |

### Typical workflow in the sheet

1. **Pick A Spot → Set up Config sheet** (once)
2. Edit **Config!B1** with your home address
3. Add restaurants (or keep example rows while testing)
4. **Pick A Spot → Look up missing addresses**
5. **Pick A Spot → Update all drive times**
6. Optional: connect **Save to Google Sheet** in Pick A Spot so new restaurants and visits save here — see [Deploy Apps Script Web app](#deploy-write-back-web-app) below.

## Deploy Apps Script Web app

Pick A Spot can push changes **to** your sheet (new restaurants, visit dates, ratings, notes). **Sync Now** only pulls **from** the sheet; saving back requires a separate Apps Script Web app deployment.

### Prerequisites

1. **Pick A Spot → Set up Config sheet** (creates the `Config` tab if needed).
2. Note the value in **Config!B2** — this is your write secret. Pick A Spot sends it with every save request.
3. You can also open **Pick A Spot → Show write-back setup** in the spreadsheet for a short in-sheet reminder.

### Deploy from Apps Script

1. Open the spreadsheet → **Extensions → Apps Script**.
2. Click **Deploy** → **New deployment**.
3. Click the gear icon next to **Select type** → choose **Web app**.
4. Set:
   - **Description** — e.g. `Pick A Spot write-back` (optional, for your reference)
   - **Execute as** — **Me** (your Google account)
   - **Who has access** — **Anyone**
5. Click **Deploy**.
6. On first deploy, Google may ask you to **Authorize access** — review permissions and allow.
7. Copy the **Web app URL** from Apps Script (looks like `https://script.google.com/macros/s/.../exec`). This is not your sheet link or Pick A Spot URL.

> **Who has access: Anyone** is required so Pick A Spot in the browser can call the endpoint. The write secret in **Config!B2** prevents unauthorized edits.

### Connect in Pick A Spot

1. Open Pick A Spot → **Settings** → **Save to Google Sheet**.
2. Paste the **Apps Script Web app URL** from the deployment.
3. Paste **Config!B2** as the write secret.
4. Tap **Save Google Sheet connection**.

After that, adding a restaurant or logging a visit in Pick A Spot updates the matching row in the sheet (matched by `id`, or by `name` if no `id`).

### Updating the script later

If you change `PickASpotDriveTimes.gs`, create a **New deployment** (or **Manage deployments → Edit → Version: New version → Deploy**) so the Web app URL serves the latest code. The URL usually stays the same when you update an existing deployment.

### Troubleshooting

| Problem | What to try |
|---------|-------------|
| Saves fail in the app | Confirm Web app URL ends in `/exec`, secret matches **Config!B2** exactly, and deployment is **Anyone** |
| Authorization errors | Re-run deploy and complete the Google authorization flow |
| Row not found | Ensure the restaurant has an `id` or unique `name` in the sheet |
| Still read-only | Write-back is optional — **Sync Now** works without a Web app deployment |
| Sync fails (HTTP 400) | Open the **Restaurants** tab, copy the URL from the address bar (`#gid=…`), confirm **Viewer** sharing, or **File → Share → Publish to web** and use the CSV link |

## Connect the app to your sheet

In the deployed Pick A Spot app (**Settings** tab):

| Setting | Value |
|---------|--------|
| **Sheet link** | Your spreadsheet URL (share: *Anyone with the link can view*) |
| **Sync Now** | Pulls sheet → app |
| **Web app URL** | From Apps Script deployment (write-back) |
| **Write secret** | `Config!B2` |

Settings are stored in your browser per device.

## Use this deployed app with your sheet

You do **not** need to fork or deploy if you only want a different restaurant list. See the root [README](../../README.md#use-the-demo-app-with-your-sheet) for the short version; the steps are the same as **Option A** or **B** above, then connect in **Settings** on any Pick A Spot deployment (e.g. the [official app](https://eeeeelizzzzz.github.io/PickASpot-App/)).

Your data stays in your Google Sheet; the app is just a client.

## Fork and deploy your own app

See [Run your own Pick A Spot](../../README.md#run-your-own-pick-a-spot) in the root README.

GitHub Pages builds automatically use `BASE_PATH=/<your-repo-name>/`, so forks work without editing the workflow unless you use a `username.github.io` repository (then `BASE_PATH` should be `/`).

## Column reference

| Column | Required | Notes |
|--------|----------|--------|
| `id` | Recommended | Stable ID; app generates if missing |
| `name` | Yes | |
| `location` | Yes | e.g. `Norman`, `OKC - City` |
| `tier` | Yes | e.g. `2: Casual / Takeout` |
| `tags` | | Separate with `;` |
| `reasons` | | Separate with `;` |
| `address` | For map / drive times | Street address |
| `distance` | | Filled by Apps Script |
| `driveTimeMin` | | Filled by Apps Script |
| `dateSaved` | | `YYYY-MM-DD` |
| `lastVisited` | | Updated by app with write-back |
| `food`, `vibe`, `service` | | 1–5 ratings |
| `parking`, `cost` | | e.g. `Easy`, `$$` |
| `notes` | | Free text |

## Files in this folder

| File | Purpose |
|------|---------|
| [`PickASpotDriveTimes.gs`](PickASpotDriveTimes.gs) | Apps Script: drive times, address lookup, sheet write API |
| [`example-restaurants.csv`](example-restaurants.csv) | Starter data + correct headers |
| [`SETUP.md`](SETUP.md) | This guide |
