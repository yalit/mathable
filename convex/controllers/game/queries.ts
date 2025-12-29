import type { Game } from "../../domain/models/Game.ts";
import {appQuery, SessionArgs} from "../../infrastructure/middleware/app.middleware.ts";
import type {GamesQueryRepositoryInterface} from "../../repository/query/games.repository.ts";
import {v} from "convex/values";
import type {PlayersQueryRepositoryInterface} from "@cvx/repository/query/players.repository.ts";
import type { Player } from "../../domain/models/Player.ts";

export const getNonFinishedForSession = appQuery({
    visibility: "public", security: "public",
    args: {...SessionArgs},
    handler: async (ctx, _): Promise<Game[]> => {
        if (!ctx.user) return []
        const playersQuery: PlayersQueryRepositoryInterface = ctx.container.get("PlayersQueryRepositoryInterface")
        const sessionPlayers: Player[] = await playersQuery.findAllByUserId(ctx.user)

        const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get("GamesQueryRepositoryInterface")
        return await gamesQuery.findNonFinishedGamesForSessionId(sessionPlayers);
    }
});

export const get = appQuery({
    visibility: "public", security: "secure",
    args: {gameToken: v.string()},
    handler: async (ctx, args): Promise<Game | null> => {
        const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get("GamesQueryRepositoryInterface")
        return await gamesQuery.findByToken(args.gameToken);
    }
});
