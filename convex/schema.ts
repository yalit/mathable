import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { vSessionId } from "convex-helpers/server/sessions";

export default defineSchema({
  games: defineTable({
    token: v.string(),
    status: v.string(),
    currentTurn: v.number(),
  }).index("by_token", ["token"]),
  players: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    token: v.string(),
    current: v.boolean(),
    score: v.number(),
    owner: v.boolean(),
    order: v.number(),
    userId: v.id("users"),
  })
    .index("by_token", ["token"])
    .index("by_game", ["gameId"])
    .index("by_game_order", ["gameId", "order"]),
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
  })
    .index("by_game_row_column", ["gameId", "row", "column"])
    .index("by_game_column_row", ["gameId", "column", "row"])
    .index("by_tile", ["tileId"]),
  tiles: defineTable({
    gameId: v.id("games"),
    playerId: v.union(v.id("players"), v.null()),
    cellId: v.union(v.id("cells"), v.null()),
    value: v.number(),
    location: v.string(),
  })
    .index("by_player", ["playerId", "location", "value"])
    .index("by_game", ["gameId"])
    .index("by_game_location", ["gameId", "location"]),
  moves: defineTable({
    gameId: v.id("games"),
    type: v.string(),
    turn: v.number(),
    moveScore: v.number(),
    cellId: v.optional(v.union(v.null(), v.id("cells"))),
    tileId: v.union(v.null(), v.id("tiles")),
    playerId: v.optional(v.union(v.null(), v.id("players"))),
  }).index("by_turn", ["gameId", "turn"]),
  users: defineTable({
    // Note: make sure not to leak this to clients. See this post for more info:
    // https://stack.convex.dev/track-sessions-without-cookies
    sessionId: vSessionId,
    name: v.string(),
  }).index("by_sessionId", ["sessionId"]),
});
