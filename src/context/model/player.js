"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerSchema = void 0;
var zod_1 = require("zod");
var tile_1 = require("./tile");
exports.playerSchema = zod_1.default.object({
    id: zod_1.default.string().nullable(),
    name: zod_1.default.string(),
    token: zod_1.default.string(),
    current: zod_1.default.boolean(),
    tiles: zod_1.default.array(tile_1.tileSchema),
    score: zod_1.default.number(),
});
