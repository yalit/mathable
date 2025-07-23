"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cellSchema = void 0;
var zod_1 = require("zod");
var game_1 = require("./game");
var tile_1 = require("./tile");
var cellTypeSchema = zod_1.default.enum(["empty", "value", "operator", "multiplier"]);
var cellOperatorSchema = zod_1.default.enum(["+", "-", "*", "/"]);
exports.cellSchema = zod_1.default.object({
    id: zod_1.default.string().nullable(),
    row: zod_1.default
        .number()
        .min(0)
        .max(game_1.GAME_SIZE - 1),
    column: zod_1.default
        .number()
        .min(0)
        .max(game_1.GAME_SIZE - 1),
    allowedValues: zod_1.default.array(zod_1.default.number()),
    type: cellTypeSchema,
    operator: cellOperatorSchema.optional().nullable(),
    value: zod_1.default.number().optional().nullable(),
    multiplier: zod_1.default.number().optional().nullable(),
    tile: tile_1.tileSchema.optional().nullable(),
});
