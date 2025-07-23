"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameSchema = exports.GAME_SIZE = void 0;
var zod_1 = require("zod");
var player_1 = require("./player");
exports.GAME_SIZE = 14;
var gameStatusSchema = zod_1.default.enum(["waiting", "ongoing", "ended"]);
exports.gameSchema = zod_1.default.object({
    id: zod_1.default.string().nullable(),
    name: zod_1.default.string(),
    token: zod_1.default.string(),
    status: gameStatusSchema.default("waiting"),
    players: zod_1.default.array(player_1.playerSchema),
});
