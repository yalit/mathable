import {appQuery} from "../../infrastructure/middleware/app.middleware.ts";
import {v} from "convex/values";
import type {GamesQueryRepositoryInterface} from "../../repository/query/games.repository.ts";
import type {CellsQueryRepositoryInterface} from "../../repository/query/cells.repository.ts";
import type {Cell} from "../../domain/models/Cell.ts";

export const getForGame = appQuery({
    visibility: "public", security: "public",
    args: {gameId: v.id("games")},
    handler: async (ctx, args): Promise<Cell[]> => {
        const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get("GamesQueryRepositoryInterface");
        const cellsQuery: CellsQueryRepositoryInterface = ctx.container.get("CellsQueryRepositoryInterface");

        const game = await gamesQuery.find(args.gameId)
        if (!game) return []

        return await cellsQuery.findAllForGame(game);
    },
});
