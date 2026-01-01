import {appQuery} from "../../infrastructure/middleware/app.middleware.ts";
import {v} from "convex/values";
import type {GamesQueryRepositoryInterface} from "../../repository/query/games.repository.ts";
import type {PlayersQueryRepositoryInterface} from "../../repository/query/players.repository.ts";

export const getForGame = appQuery({
    args: {gameId: v.union(v.id("games"), v.null())},
    handler: async (ctx, args) => {
        if (!args.gameId) return []

        const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get("GamesQueryRepositoryInterface");
        const playersQuery: PlayersQueryRepositoryInterface = ctx.container.get("PlayersQueryRepositoryInterface");

        const game = await gamesQuery.find(args.gameId)
        if (!game) return []

        const players = await playersQuery.findByGame(game);
        return players.map(p => p.toJSON());
    },
});
