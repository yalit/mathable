import {appQuery} from "../../infrastructure/middleware/app.middleware.ts";
import {v} from "convex/values";
import type {GamesQueryRepositoryInterface} from "../../repository/query/games.repository.ts";
import type {CellsQueryRepositoryInterface} from "../../repository/query/cells.repository.ts";

export const getForGame = appQuery({
    args: {gameId: v.union(v.id("games"), v.null())},
    handler: async (ctx, args) => {
        if (!args.gameId) return []

        const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get("GamesQueryRepositoryInterface");
        const cellsQuery: CellsQueryRepositoryInterface = ctx.container.get("CellsQueryRepositoryInterface");

        const game = await gamesQuery.find(args.gameId)
        if (!game) return []

        const cells = await cellsQuery.findAllForGame(game);
        return cells.map(c => c.toJSON());
    },
});
