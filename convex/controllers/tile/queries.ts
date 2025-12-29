import {appQuery} from "../../middleware/app.middleware.ts";
import {v} from "convex/values";
import type {GameQueryRepositoryInterface} from "../../repository/query/games.repository.ts";
import type {TilesQueryRepositoryInterface} from "../../repository/query/tiles.repository.ts";
import type {Tile} from "../../domain/models/Tile.ts";

export const getForGame = appQuery({
    visibility: "public", security: "public",
    args: {gameId: v.id("games")},
    handler: async (ctx, args): Promise<Tile[]> => {
        const gamesQuery: GameQueryRepositoryInterface = ctx.container.get("GamesQueryRepositoryInterface");
        const tilesQuery: TilesQueryRepositoryInterface = ctx.container.get("TilesQueryRepositoryInterface");

        const game = await gamesQuery.find(args.gameId)
        if (!game) return []

        return await tilesQuery.findAllByGame(game);
    },
});
