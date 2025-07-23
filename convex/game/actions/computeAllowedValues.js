"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAllowedValuesForCell = exports.computeAllowedValuesFromUpdatedCell = exports.computeAllAllowedValues = void 0;
var values_1 = require("convex/values");
var server_1 = require("@cvx/_generated/server");
var api_1 = require("@cvx/_generated/api");
var impactingDirections = ["left", "right", "up", "down"];
exports.computeAllAllowedValues = (0, server_1.internalMutation)({
    args: { gameId: values_1.v.id("games") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var cells;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("cells")
                        .withIndex("by_game_row_number", function (q) { return q.eq("gameId", args.gameId); })
                        .collect()];
                case 1:
                    cells = _a.sent();
                    cells.forEach(function (cell) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, ctx.runMutation(api_1.internal.game.actions.computeAllowedValues
                                        .computeAllowedValuesForCell, { cellId: cell._id })];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    }); },
});
exports.computeAllowedValuesFromUpdatedCell = (0, server_1.internalMutation)({
    args: { cellId: values_1.v.id("cells") },
    handler: function (ctx, args) {
        impactingDirections.forEach(function (direction) { return __awaiter(void 0, void 0, void 0, function () {
            var impacts, impactedCells;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ctx.db
                            .query("cellImpacts")
                            .withIndex("by_direction_impacting_cell", function (q) {
                            return q.eq("direction", direction).eq("impactingCellId", args.cellId);
                        })
                            .collect()];
                    case 1:
                        impacts = _a.sent();
                        impactedCells = [];
                        impacts.forEach(function (ci) { return __awaiter(void 0, void 0, void 0, function () {
                            var cell;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, ctx.db.get(ci.impactedCellId)];
                                    case 1:
                                        cell = _a.sent();
                                        if (cell) {
                                            impactedCells.push(cell);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        impactedCells.forEach(function (c) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, ctx.runMutation(api_1.internal.game.actions.computeAllowedValues
                                            .computeAllowedValuesForCell, { cellId: c._id })];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        }); });
    },
});
exports.computeAllowedValuesForCell = (0, server_1.internalMutation)({
    args: { cellId: values_1.v.id("cells") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var cell, allowedValues;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.cellId)];
                case 1:
                    cell = _a.sent();
                    if (!cell) {
                        console.log(args.cellId, "No cell");
                        return [2 /*return*/];
                    }
                    if (!!hasValue(cell)) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.patch(cell._id, { allowedValues: [] })];
                case 2:
                    _a.sent();
                    console.log(args.cellId, "Cell not a value or not has a tile");
                    return [2 /*return*/];
                case 3:
                    allowedValues = new Set();
                    return [4 /*yield*/, Promise.all(impactingDirections.map(function (direction) { return __awaiter(void 0, void 0, void 0, function () {
                            var impacts, impactingCells, value, first, second, add, sub, mult, div;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, ctx.db
                                            .query("cellImpacts")
                                            .withIndex("by_direction_impacted_cell", function (q) {
                                            return q.eq("direction", direction).eq("impactedCellId", args.cellId);
                                        })
                                            .collect()];
                                    case 1:
                                        impacts = _a.sent();
                                        impactingCells = [];
                                        impacts.forEach(function (ci) { return __awaiter(void 0, void 0, void 0, function () {
                                            var cell;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, ctx.db.get(ci.impactingCellId)];
                                                    case 1:
                                                        cell = _a.sent();
                                                        if (cell && (cell.value || cell.tileId)) {
                                                            // only impacting if there is a value in it
                                                            impactingCells.push(cell);
                                                        }
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                        if (impactingCells.length !== 2) {
                                            console.log(cell.row, cell.column, direction, "not enough impacting cells");
                                            return [2 /*return*/];
                                        }
                                        value = function (c) { return __awaiter(void 0, void 0, void 0, function () {
                                            var tile;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        if (c.value) {
                                                            return [2 /*return*/, c.value];
                                                        }
                                                        if (!c.tileId) return [3 /*break*/, 2];
                                                        return [4 /*yield*/, ctx.db.get(c.tileId)];
                                                    case 1:
                                                        tile = _a.sent();
                                                        if (!tile) {
                                                            throw new Error("Tile is not existing");
                                                        }
                                                        return [2 /*return*/, tile.value];
                                                    case 2: throw new Error("No value for the cell");
                                                }
                                            });
                                        }); };
                                        return [4 /*yield*/, value(impactingCells[0])];
                                    case 2:
                                        first = _a.sent();
                                        return [4 /*yield*/, value(impactingCells[1])];
                                    case 3:
                                        second = _a.sent();
                                        console.log("Values", cell.row, cell.column, direction, first, second);
                                        add = [first + second];
                                        sub = [first - second];
                                        mult = [first * second];
                                        div = [];
                                        if (second !== 0 && Number.isInteger(first / second)) {
                                            div.push(first / second);
                                        }
                                        if (first !== 0 && Number.isInteger(second / first)) {
                                            div.push(second / first);
                                        }
                                        if (cell.type === "operator") {
                                            switch (cell.operator) {
                                                case "+":
                                                    allowedValues.add(add[0]);
                                                    break;
                                                case "-":
                                                    allowedValues.add(sub[0]);
                                                    break;
                                                case "*":
                                                    allowedValues.add(mult[0]);
                                                    break;
                                                case "/":
                                                    div.forEach(function (n) { return allowedValues.add(n); });
                                                    break;
                                            }
                                        }
                                        else {
                                            add.concat(sub, mult, div).forEach(allowedValues.add);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 4:
                    _a.sent();
                    // update the cells with the allowedValues
                    return [4 /*yield*/, ctx.db.patch(cell._id, {
                            allowedValues: Array.from(allowedValues),
                        })];
                case 5:
                    // update the cells with the allowedValues
                    _a.sent();
                    console.log(cell.row, cell.column, allowedValues);
                    return [2 /*return*/];
            }
        });
    }); },
});
