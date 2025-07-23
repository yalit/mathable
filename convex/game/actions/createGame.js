"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var server_1 = require("../../_generated/server");
var values_1 = require("convex/values");
var uuidFactory_1 = require("../../../src/context/factories/uuidFactory");
var cellFactory_1 = require("../../../src/context/factories/cellFactory");
var game_1 = require("../../../src/context/model/game");
var api_1 = require("../../_generated/api");
exports.default = (0, server_1.mutation)({
    args: { gameName: values_1.v.string(), playerName: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var gameId, playerId, boardCells, cellImpacts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("games", {
                        name: args.gameName,
                        token: (0, uuidFactory_1.UUID)(),
                        status: "waiting",
                    })];
                case 1:
                    gameId = _a.sent();
                    return [4 /*yield*/, ctx.db.insert("players", {
                            gameId: gameId,
                            name: args.playerName,
                            token: (0, uuidFactory_1.UUID)(),
                            current: false,
                            score: 0,
                        })];
                case 2:
                    playerId = _a.sent();
                    boardCells = getBoardCells();
                    return [4 /*yield*/, Promise.all(boardCells.map(function (c) { return __awaiter(void 0, void 0, void 0, function () {
                            var cellId;
                            var _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0: return [4 /*yield*/, ctx.db.insert("cells", {
                                            gameId: gameId,
                                            row: c.row,
                                            column: c.column,
                                            allowedValues: [],
                                            type: c.type,
                                            value: (_a = c.value) !== null && _a !== void 0 ? _a : null,
                                            multiplier: (_b = c.multiplier) !== null && _b !== void 0 ? _b : null,
                                            operator: (_c = c.operator) !== null && _c !== void 0 ? _c : null,
                                            tileId: null,
                                        })];
                                    case 1:
                                        cellId = _d.sent();
                                        return [2 /*return*/, __assign(__assign({}, c), { id: cellId })];
                                }
                            });
                        }); }))];
                case 3:
                    boardCells = _a.sent();
                    cellImpacts = getBoardCellImpacts(boardCells);
                    cellImpacts.forEach(function (ci) {
                        return ctx.db.insert("cellImpacts", {
                            direction: ci.direction,
                            impactedCellId: ci.impactedCell.id,
                            impactingCellId: ci.impactingCell.id,
                        });
                    });
                    // generate allowedValues
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.game.actions.computeAllowedValues.computeAllAllowedValues, { gameId: gameId })];
                case 4:
                    // generate allowedValues
                    _a.sent();
                    // create Tiles
                    getGameTiles().forEach(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, ctx.db.insert("tiles", {
                                        gameId: gameId,
                                        value: t.value,
                                        location: t.location,
                                        playerId: null,
                                        cellId: null,
                                    })];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/, { gameId: gameId, playerId: playerId }];
            }
        });
    }); },
});
var getBoardCells = function () {
    var cells = [];
    // 3x Multipliers
    cells.push((0, cellFactory_1.createMultiplierCell)(0, 0, 3));
    cells.push((0, cellFactory_1.createMultiplierCell)(0, 6, 3));
    cells.push((0, cellFactory_1.createMultiplierCell)(0, 7, 3));
    cells.push((0, cellFactory_1.createMultiplierCell)(0, 13, 3));
    cells.push((0, cellFactory_1.createMultiplierCell)(6, 0, 3));
    cells.push((0, cellFactory_1.createMultiplierCell)(6, 13, 3));
    cells.push((0, cellFactory_1.createMultiplierCell)(13, 0, 3));
    cells.push((0, cellFactory_1.createMultiplierCell)(13, 6, 3));
    cells.push((0, cellFactory_1.createMultiplierCell)(13, 7, 3));
    cells.push((0, cellFactory_1.createMultiplierCell)(13, 13, 3));
    cells.push((0, cellFactory_1.createMultiplierCell)(7, 0, 3));
    cells.push((0, cellFactory_1.createMultiplierCell)(7, 13, 3));
    //2x Multipliers
    cells.push((0, cellFactory_1.createMultiplierCell)(1, 1, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(1, 12, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(2, 2, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(2, 11, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(3, 3, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(3, 10, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(4, 4, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(4, 9, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(12, 1, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(12, 12, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(11, 2, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(11, 11, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(10, 3, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(10, 10, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(9, 4, 2));
    cells.push((0, cellFactory_1.createMultiplierCell)(9, 9, 2));
    // + Operators
    cells.push((0, cellFactory_1.createOperatorCell)(3, 6, "+"));
    cells.push((0, cellFactory_1.createOperatorCell)(4, 7, "+"));
    cells.push((0, cellFactory_1.createOperatorCell)(6, 4, "+"));
    cells.push((0, cellFactory_1.createOperatorCell)(7, 3, "+"));
    cells.push((0, cellFactory_1.createOperatorCell)(6, 10, "+"));
    cells.push((0, cellFactory_1.createOperatorCell)(7, 9, "+"));
    cells.push((0, cellFactory_1.createOperatorCell)(9, 6, "+"));
    cells.push((0, cellFactory_1.createOperatorCell)(10, 7, "+"));
    // - Operators
    cells.push((0, cellFactory_1.createOperatorCell)(2, 5, "-"));
    cells.push((0, cellFactory_1.createOperatorCell)(2, 8, "-"));
    cells.push((0, cellFactory_1.createOperatorCell)(5, 2, "-"));
    cells.push((0, cellFactory_1.createOperatorCell)(8, 2, "-"));
    cells.push((0, cellFactory_1.createOperatorCell)(5, 11, "-"));
    cells.push((0, cellFactory_1.createOperatorCell)(8, 11, "-"));
    cells.push((0, cellFactory_1.createOperatorCell)(11, 5, "-"));
    cells.push((0, cellFactory_1.createOperatorCell)(11, 8, "-"));
    // * Operators
    cells.push((0, cellFactory_1.createOperatorCell)(3, 7, "*"));
    cells.push((0, cellFactory_1.createOperatorCell)(4, 6, "*"));
    cells.push((0, cellFactory_1.createOperatorCell)(6, 3, "*"));
    cells.push((0, cellFactory_1.createOperatorCell)(7, 4, "*"));
    cells.push((0, cellFactory_1.createOperatorCell)(6, 9, "*"));
    cells.push((0, cellFactory_1.createOperatorCell)(7, 10, "*"));
    cells.push((0, cellFactory_1.createOperatorCell)(9, 7, "*"));
    cells.push((0, cellFactory_1.createOperatorCell)(10, 6, "*"));
    // / Operators
    cells.push((0, cellFactory_1.createOperatorCell)(1, 4, "/"));
    cells.push((0, cellFactory_1.createOperatorCell)(1, 9, "/"));
    cells.push((0, cellFactory_1.createOperatorCell)(4, 1, "/"));
    cells.push((0, cellFactory_1.createOperatorCell)(9, 1, "/"));
    cells.push((0, cellFactory_1.createOperatorCell)(4, 12, "/"));
    cells.push((0, cellFactory_1.createOperatorCell)(9, 12, "/"));
    cells.push((0, cellFactory_1.createOperatorCell)(12, 4, "/"));
    cells.push((0, cellFactory_1.createOperatorCell)(12, 9, "/"));
    // central placed digits
    cells.push((0, cellFactory_1.createValueCell)(6, 6, 1));
    cells.push((0, cellFactory_1.createValueCell)(6, 7, 2));
    cells.push((0, cellFactory_1.createValueCell)(7, 6, 3));
    cells.push((0, cellFactory_1.createValueCell)(7, 7, 4));
    var index = function (row, col) { return row * game_1.GAME_SIZE + col; };
    var indexes = new Set();
    cells.forEach(function (c) { return indexes.add(index(c.row, c.column)); });
    for (var r = 0; r < game_1.GAME_SIZE; r++) {
        for (var c = 0; c < game_1.GAME_SIZE; c++) {
            if (indexes.has(index(r, c))) {
                continue;
            }
            cells.push((0, cellFactory_1.createEmptyCell)(r, c));
        }
    }
    return cells;
};
var getBoardCellImpacts = function (cells) {
    var impacts = [];
    cells.forEach(function (impactedCell) {
        // left
        var impactingCells = cells.filter(function (c) {
            return c.column >= 0 &&
                c.row === impactedCell.row &&
                c.column >= impactedCell.column - 2;
        });
        impactingCells.forEach(function (impactingCell) {
            impacts.push({ direction: "left", impactedCell: impactedCell, impactingCell: impactingCell });
        });
        // right
        impactingCells = cells.filter(function (c) {
            return c.column < game_1.GAME_SIZE &&
                c.row === impactedCell.row &&
                c.column <= impactedCell.column + 2;
        });
        impactingCells.forEach(function (impactingCell) {
            impacts.push({ direction: "right", impactedCell: impactedCell, impactingCell: impactingCell });
        });
        // down
        impactingCells = cells.filter(function (c) {
            return c.row < game_1.GAME_SIZE &&
                c.column === impactedCell.column &&
                c.row <= impactedCell.row + 2;
        });
        impactingCells.forEach(function (impactingCell) {
            impacts.push({ direction: "down", impactedCell: impactedCell, impactingCell: impactingCell });
        });
        // down
        impactingCells = cells.filter(function (c) {
            return c.row >= 0 &&
                c.column === impactedCell.column &&
                c.row >= impactedCell.row - 2;
        });
        impactingCells.forEach(function (impactingCell) {
            impacts.push({ direction: "down", impactedCell: impactedCell, impactingCell: impactingCell });
        });
    });
    return impacts;
};
var getGameTiles = function () {
    var tiles = [];
    return tiles;
};
