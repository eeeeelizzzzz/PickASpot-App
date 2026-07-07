import { Router } from "express";
import { db, restaurantsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /api/restaurants — fetch all
router.get("/restaurants", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(restaurantsTable)
      .orderBy(restaurantsTable.name);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// POST /api/restaurants — create one
router.post("/restaurants", async (req, res) => {
  try {
    const body = req.body;
    if (!body.id || !body.name || !body.tier) {
      return res.status(400).json({ error: "id, name, and tier are required" });
    }
    const [row] = await db
      .insert(restaurantsTable)
      .values({
        id:          body.id,
        name:        body.name,
        location:    body.location   ?? "OKC - City",
        tier:        body.tier,
        distance:    body.distance   ?? "",
        tags:        body.tags        ?? [],
        reasons:     body.reasons     ?? [],
        dateSaved:   body.dateSaved   ?? new Date().toISOString().slice(0, 10),
        lastVisited: body.lastVisited ?? null,
        bestSeasons: body.bestSeasons ?? [],
        ratings:     body.ratings     ?? null,
        notes:       body.notes       ?? "",
      })
      .onConflictDoUpdate({
        target: restaurantsTable.id,
        set: {
          name:        sql`excluded.name`,
          location:    sql`excluded.location`,
          tier:        sql`excluded.tier`,
          distance:    sql`excluded.distance`,
          tags:        sql`excluded.tags`,
          reasons:     sql`excluded.reasons`,
          dateSaved:   sql`excluded.date_saved`,
          lastVisited: sql`excluded.last_visited`,
          bestSeasons: sql`excluded.best_seasons`,
          ratings:     sql`excluded.ratings`,
          notes:       sql`excluded.notes`,
          updatedAt:   sql`NOW()`,
        },
      })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to create restaurant" });
  }
});

// PUT /api/restaurants/:id — update one
router.put("/restaurants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const [row] = await db
      .update(restaurantsTable)
      .set({
        name:        body.name,
        location:    body.location,
        tier:        body.tier,
        distance:    body.distance,
        tags:        body.tags,
        reasons:     body.reasons,
        dateSaved:   body.dateSaved,
        lastVisited: body.lastVisited ?? null,
        bestSeasons: body.bestSeasons,
        ratings:     body.ratings     ?? null,
        notes:       body.notes       ?? "",
        updatedAt:   new Date(),
      })
      .where(eq(restaurantsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to update restaurant" });
  }
});

// DELETE /api/restaurants/:id — delete one
router.delete("/restaurants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(restaurantsTable).where(eq(restaurantsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete restaurant" });
  }
});

// POST /api/restaurants/bulk — upsert many (for import)
router.post("/restaurants/bulk", async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: "Expected array" });
    if (items.length === 0) return res.json([]);

    const rows = await db
      .insert(restaurantsTable)
      .values(items.map(b => ({
        id:          b.id,
        name:        b.name        ?? "Unknown",
        location:    b.location    ?? "OKC - City",
        tier:        b.tier        ?? "1: Delivery / Couch Meal",
        distance:    b.distance    ?? "",
        tags:        b.tags        ?? [],
        reasons:     b.reasons     ?? [],
        dateSaved:   b.dateSaved   ?? new Date().toISOString().slice(0, 10),
        lastVisited: b.lastVisited ?? null,
        bestSeasons: b.bestSeasons ?? [],
        ratings:     b.ratings     ?? null,
        notes:       b.notes       ?? "",
      })))
      .onConflictDoUpdate({
        target: restaurantsTable.id,
        set: {
          name:        sql`excluded.name`,
          location:    sql`excluded.location`,
          tier:        sql`excluded.tier`,
          distance:    sql`excluded.distance`,
          tags:        sql`excluded.tags`,
          reasons:     sql`excluded.reasons`,
          dateSaved:   sql`excluded.date_saved`,
          lastVisited: sql`excluded.last_visited`,
          bestSeasons: sql`excluded.best_seasons`,
          ratings:     sql`excluded.ratings`,
          notes:       sql`excluded.notes`,
          updatedAt:   sql`NOW()`,
        },
      })
      .returning();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to bulk upsert" });
  }
});

// ─── Sheet Sync ─────────────────────────────────────────────────────────────

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // skip
      } else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function toSheetCsvUrl(input: string): string {
  const trimmed = input.trim();
  // Already a direct CSV/export/publish URL — use as-is
  if (/output=csv|format=csv|\.csv($|\?)/i.test(trimmed)) return trimmed;
  const idMatch = trimmed.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return trimmed;
  const id = idMatch[1];
  const gidMatch = trimmed.match(/gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function genId(): string {
  return "r" + Date.now() + Math.random().toString(36).slice(2, 6);
}

// POST /api/restaurants/sync-sheet — fetch a published/shared Google Sheet CSV and upsert
router.post("/restaurants/sync-sheet", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url is required" });
    }
    const csvUrl = toSheetCsvUrl(url);

    const fetchRes = await fetch(csvUrl);
    if (!fetchRes.ok) {
      return res.status(400).json({
        error: `Could not fetch sheet (HTTP ${fetchRes.status}). Make sure it's shared as "Anyone with the link can view".`,
      });
    }
    const csvText = await fetchRes.text();
    const rows = parseCsvText(csvText);
    if (rows.length < 2) {
      return res.status(400).json({ error: "Sheet has no data rows" });
    }
    const header = rows[0].map((h) => h.trim());
    const dataRows = rows.slice(1);

    const existing = await db.select().from(restaurantsTable);
    const byId = new Map(existing.map((r) => [r.id, r]));
    const byName = new Map(existing.map((r) => [r.name.trim().toLowerCase(), r]));

    const num = (v: string | undefined) => (v === "" || v === undefined ? null : Number(v));

    const upserts: any[] = [];
    dataRows.forEach((cells) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => {
        obj[h] = cells[i] !== undefined ? cells[i] : "";
      });
      if (!obj.name || !obj.name.trim()) return;

      const matchedById = obj.id && obj.id.trim() ? byId.get(obj.id.trim()) : undefined;
      const matchedByName = byName.get(obj.name.trim().toLowerCase());
      const existingRow = matchedById ?? matchedByName;

      upserts.push({
        id: existingRow?.id ?? (obj.id && obj.id.trim()) ?? genId(),
        name: obj.name.trim(),
        location: obj.location || existingRow?.location || "OKC - City",
        tier: obj.tier || existingRow?.tier || "1: Delivery / Couch Meal",
        address: obj.address || existingRow?.address || "",
        distance: obj.distance || existingRow?.distance || "",
        tags: (obj.tags || "").split(/[;,]/).map((t) => t.trim()).filter(Boolean),
        reasons: (obj.reasons || "").split(/[;,]/).map((t) => t.trim()).filter(Boolean),
        dateSaved: obj.dateSaved || existingRow?.dateSaved || new Date().toISOString().slice(0, 10),
        lastVisited: obj.lastVisited || null,
        bestSeasons: existingRow?.bestSeasons ?? [],
        ratings: {
          food: num(obj.food),
          vibe: num(obj.vibe),
          service: num(obj.service),
          parking: obj.parking || null,
          cost: obj.cost || null,
        },
        notes: obj.notes || "",
      });
    });

    if (upserts.length === 0) {
      return res.status(400).json({ error: "No valid rows found in sheet" });
    }

    const rowsOut = await db
      .insert(restaurantsTable)
      .values(upserts)
      .onConflictDoUpdate({
        target: restaurantsTable.id,
        set: {
          name: sql`excluded.name`,
          location: sql`excluded.location`,
          tier: sql`excluded.tier`,
          distance: sql`excluded.distance`,
          tags: sql`excluded.tags`,
          reasons: sql`excluded.reasons`,
          dateSaved: sql`excluded.date_saved`,
          lastVisited: sql`excluded.last_visited`,
          bestSeasons: sql`excluded.best_seasons`,
          ratings: sql`excluded.ratings`,
          notes: sql`excluded.notes`,
          updatedAt: sql`NOW()`,
        },
      })
      .returning();

    res.json({ synced: rowsOut.length, restaurants: rowsOut });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sync from sheet" });
  }
});

export default router;
