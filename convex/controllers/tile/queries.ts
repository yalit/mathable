import {appQuery} from "../../infrastructure/middleware/app.middleware.ts";
import {v} from "convex/values";
import type {GamesQueryRepositoryInterface} from "../../repository/query/games.repository.ts";
import type {TilesQueryRepositoryInterface} from "../../repository/query/tiles.repository.ts";
import type {Tile} from "../../domain/models/Tile.ts";

export const getForGame = appQuery({
    args: {gameId: v.union(v.id("games"), v.null())},
    handler: async (ctx, args): Promise<Tile[]> => {
        if(!args.gameId) return []

        const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get("GamesQueryRepositoryInterface");
        const tilesQuery: TilesQueryRepositoryInterface = ctx.container.get("TilesQueryRepositoryInterface");

        const game = await gamesQuery.find(args.gameId)
        if (!game) return []

        return await tilesQuery.findAllByGame(game);
    },
});
