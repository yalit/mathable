"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var server_1 = require("convex/server");
var values_1 = require("convex/values");
exports.default = (0, server_1.defineSchema)({
    games: (0, server_1.defineTable)({
        name: values_1.v.string(),
        token: values_1.v.string(),
        status: values_1.v.string(),
    }).index("by_token", ["token"]),
    players: (0, server_1.defineTable)({
        gameId: values_1.v.id("games"),
        name: values_1.v.string(),
        token: values_1.v.string(),
        current: values_1.v.boolean(),
        score: values_1.v.number(),
    }).index("by_token", ["token"]),
    cells: (0, server_1.defineTable)({
        gameId: values_1.v.id("games"),
        row: values_1.v.number(),
        column: values_1.v.number(),
        allowedValues: values_1.v.array(values_1.v.number()),
        type: values_1.v.string(),
        value: values_1.v.union(values_1.v.number(), values_1.v.null()),
        multiplier: values_1.v.union(values_1.v.number(), values_1.v.null()),
        operator: values_1.v.union(values_1.v.string(), values_1.v.null()),
        tileId: values_1.v.union(values_1.v.id("tiles"), values_1.v.null()),
    }).index("by_game_row_number", ["gameId", "row", "column"]),
    tiles: (0, server_1.defineTable)({
        gameId: values_1.v.id("games"),
        playerId: values_1.v.union(values_1.v.id("players"), values_1.v.null()),
        cellId: values_1.v.union(values_1.v.id("cells"), values_1.v.null()),
        value: values_1.v.number(),
        location: values_1.v.string(),
    }),
    cellImpacts: (0, server_1.defineTable)({
        direction: values_1.v.string(),
        impactedCellId: values_1.v.id("cells"),
        impactingCellId: values_1.v.id("cells"),
    })
        .index("by_direction_impacted_cell", ["direction", "impactedCellId"])
        .index("by_direction_impacting_cell", ["direction", "impactingCellId"]),
});
