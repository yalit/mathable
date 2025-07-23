import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  games: defineTable({
    name: v.string(),
    token: v.string(),
    status: v.string(),
  }).index("by_token", ["token"]),
  players: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    token: v.string(),
    current: v.boolean(),
    score: v.number(),
  }).index("by_token", ["token"]),
  cells: defineTable({
    gameId: v.id("games"),
    row: v.number(),
    column: v.number(),
    allowedValues: v.array(v.number()),
    type: v.string(),
    value: v.union(v.number(), v.null()),
    multiplier: v.union(v.number(), v.null()),
    operator: v.union(v.string(), v.null()),
    tileId: v.union(v.id("tiles"), v.null()),
  }).index("by_game_row_number", ["gameId", "row", "column"]),
  tiles: defineTable({
    gameId: v.id("games"),
    playerId: v.union(v.id("players"), v.null()),
    cellId: v.union(v.id("cells"), v.null()),
    value: v.number(),
    location: v.string(),
  }),
  cellImpacts: defineTable({
    direction: v.string(),
    impactedCellId: v.id("cells"),
    impactingCellId: v.id("cells"),
  })
    .index("by_direction_impacted_cell", ["direction", "impactedCellId"])
    .index("by_direction_impacting_cell", ["direction", "impactingCellId"]),
});
