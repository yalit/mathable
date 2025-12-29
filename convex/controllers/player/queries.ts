import {appQuery} from "../../infrastructure/middleware/app.middleware.ts";
import {v} from "convex/values";
import type {Player} from "../../domain/models/Player.ts";
import type {GameQueryRepositoryInterface} from "../../repository/query/games.repository.ts";
import type {PlayersQueryRepositoryInterface} from "../../repository/query/players.repository.ts";

export const get = appQuery({
    visibility: "public", security: "public",
    args: { playerToken: v.string() },
    handler: async (ctx, args): Promise<Player | null> => {
        const playersQuery = ctx.container.get("PlayersQueryRepositoryInterface");

        return await playersQuery.findByToken(args.playerToken);
    },
});

export const getForGame = appQuery({
    visibility: "public", security: "public",
    args: {gameId: v.id("games")},
    handler: async (ctx, args): Promise<Player[]> => {
        const gamesQuery: GameQueryRepositoryInterface = ctx.container.get("GamesQueryRepositoryInterface");
        const playersQuery: PlayersQueryRepositoryInterface = ctx.container.get("PlayersQueryRepositoryInterface");

        const game = await gamesQuery.find(args.gameId)
        if (!game) return []

        return await playersQuery.findByGame(game);
    },
});
