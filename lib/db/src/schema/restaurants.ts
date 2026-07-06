import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const restaurantsTable = pgTable("restaurants", {
  id:           text("id").primaryKey(),
  name:         text("name").notNull(),
  location:     text("location").notNull(),
  tier:         text("tier").notNull(),
  distance:     text("distance").notNull().default(""),
  tags:         jsonb("tags").$type<string[]>().notNull().default([]),
  reasons:      jsonb("reasons").$type<string[]>().notNull().default([]),
  dateSaved:    text("date_saved").notNull(),
  lastVisited:  text("last_visited"),
  bestSeasons:  jsonb("best_seasons").$type<string[]>().notNull().default([]),
  ratings:      jsonb("ratings").$type<{
    food:    number | null;
    vibe:    number | null;
    service: number | null;
    parking: string | null;
    cost:    string | null;
  } | null>(),
  notes:        text("notes").notNull().default(""),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Restaurant    = typeof restaurantsTable.$inferSelect;
export type NewRestaurant = typeof restaurantsTable.$inferInsert;
