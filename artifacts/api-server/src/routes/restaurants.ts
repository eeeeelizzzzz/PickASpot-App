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
        location:    body.location   ?? "OKC",
        tier:        body.tier,
        tags:        body.tags        ?? [],
        acclaimed:   body.acclaimed   ?? false,
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
          tags:        sql`excluded.tags`,
          acclaimed:   sql`excluded.acclaimed`,
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
        tags:        body.tags,
        acclaimed:   body.acclaimed,
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
        location:    b.location    ?? "OKC",
        tier:        b.tier        ?? "The Fun Category",
        tags:        b.tags        ?? [],
        acclaimed:   b.acclaimed   ?? false,
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
          tags:        sql`excluded.tags`,
          acclaimed:   sql`excluded.acclaimed`,
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

export default router;
