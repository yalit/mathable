import {appQuery} from "../../infrastructure/middleware/app.middleware.ts";
import {v} from "convex/values";
import type {GamesQueryRepositoryInterface} from "../../repository/query/games.repository.ts";
import type {CellsQueryRepositoryInterface} from "../../repository/query/cells.repository.ts";
import type {Cell} from "../../domain/models/Cell.ts";

export const getForGame = appQuery({
    args: {gameId: v.union(v.id("games"), v.null())},
    handler: async (ctx, args): Promise<Cell[]> => {
        if (!args.gameId) return []

        const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get("GamesQueryRepositoryInterface");
        const cellsQuery: CellsQueryRepositoryInterface = ctx.container.get("CellsQueryRepositoryInterface");

        const game = await gamesQuery.find(args.gameId)
        if (!game) return []

        return await cellsQuery.findAllForGame(game);
    },
});
