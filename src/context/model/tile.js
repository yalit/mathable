"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tileSchema = void 0;
var zod_1 = require("zod");
var tileLocationSchema = zod_1.default.enum(["in_bag", "in_hand", "on_board"]);
exports.tileSchema = zod_1.default.object({
    id: zod_1.default.string().nullable(),
    value: zod_1.default.number(),
    location: tileLocationSchema,
});
