import {
    getBoardCells,
    getInitialGameTiles,
} from "../../../src/context/factories/gameFactory";
import {UUID} from "../../../src/context/factories/uuidFactory";
import type {Cell} from "../../../src/context/model/cell";
import {internal} from "../../_generated/api";
import type {Doc, Id} from "../../_generated/dataModel";
import {v} from "convex/values";
import {vSessionId} from "convex-helpers/server/sessions";
import {withSessionMutation} from "../../middleware/sessions";
import {withRepositoryMutation} from "../../middleware/repository.middleware.ts";
import {PlayersQueryRepository} from "../../repository/query/players.repository.ts";
import {GamesQueryRepository} from "../../repository/query/game.repository.ts";
import {TilesQueryRepository} from "../../repository/query/tiles.repository.ts";

export const create = withRepositoryMutation({
    args: {playerName: v.string(), sessionId: vSessionId},
    handler: async (ctx, args) => {
        // create Game
        const gameId = await ctx.db.insert("games", {
            token: UUID(),
            status: "waiting",
            currentTurn: 0,
        });
        const game = await ctx.db.get(gameId);

        // create playerName
        const playerId: Id<"players"> = await ctx.runMutation(
            internal.mutations.internal.player.create,
            {gameId, name: args.playerName, sessionId: args.sessionId},
        );
        // set the user as owner
        await ctx.db.patch(playerId, {owner: true});
        const player = await ctx.db.get(playerId);

        // create Cells
        const boardCells = getBoardCells();
        await Promise.all(
            boardCells.map(async (c: Cell) => {
                const cellId = await ctx.db.insert("cells", {
                    gameId,
                    row: c.row,
                    column: c.column,
                    allowedValues: [],
                    type: c.type,
                    value: c.type === "value" ? c.value : null,
                    multiplier: c.type === "multiplier" ? c.multiplier : null,
                    operator: c.type === "operator" ? c.operator : null,
                    tileId: null,
                });
                return {
                    ...c,
                    id: cellId,
                };
            }),
        );

        // generate allowedValues
        await ctx.runMutation(
            internal.mutations.internal.cell.computeAllAllowedValues,
            {gameId},
        );

        // create Tiles
        for (const t of getInitialGameTiles()) {
            await ctx.db.insert("tiles", {
                gameId,
                value: t.value,
                location: t.location,
                playerId: null,
                cellId: null,
            });
        }

        return {gameToken: game?.token ?? "", playerToken: player?.token ?? ""};
    },
});

export const join = withRepositoryMutation({
    args: {
        gameId: v.id("games"),
        playerName: v.string(),
        sessionId: vSessionId,
    },
    handler: async (ctx, args): Promise<{ success: boolean; token: string }> => {
        const game = await ctx.db.get(args.gameId);
        if (!game) {
            return {success: false, token: ""};
        }

        const players = await PlayersQueryRepository.instance.findByGame(game._id)

        if (players.length >= 4) {
            return {success: false, token: ""};
        }

        const playerId = await ctx.runMutation(
            internal.mutations.internal.player.create,
            {gameId: args.gameId, name: args.playerName, sessionId: args.sessionId},
        );

        const player = await PlayersQueryRepository.instance.find(playerId)

        return {success: player !== null, token: player?.token ?? ""};
    },
});

export const start = withSessionMutation({
    args: {gameId: v.id("games")},
    handler: async (ctx, {gameId}) => {
        const game: Doc<"games"> | null = await GamesQueryRepository.instance.find(gameId);

        if (!game) {
            return;
        }

        if (!ctx.user) {
            return;
        }

        const players = await PlayersQueryRepository.instance.findByGame(game._id)
        const owner = players.filter((p) => p.owner);
        if (owner.length === 0 || owner[0].userId !== ctx.user._id) {
            return;
        }

        // change the status & setup the currentTurn
        await ctx.db.patch(gameId, {status: "ongoing", currentTurn: 1});

        // set the random order for the players
        // set the current player to the player with order 1
        // randomize the order
        players.sort(() => Math.random() - 0.5);
        players.forEach(async (p, idx) => {
            await ctx.db.patch(p._id as Id<"players">, {
                order: idx + 1,
                current: idx === 0,
            });
        });

        // set the tiles for each users
        players.forEach(async (p) => {
            const tiles = await TilesQueryRepository.instance.findAllInBagByGame(game._id)
            tiles.sort(() => Math.random() - 0.5);
            tiles.slice(0, 7).forEach(async (t) => {
                await ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
                    tileId: t._id as Id<"tiles">,
                    playerId: p._id as Id<"players">,
                });
            });
        });
    },
});

//TODO : implement endGame
export const endGame = {};
