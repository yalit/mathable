import type { Game } from "../../domain/models/Game.ts";
import {appQuery, SessionArgs} from "../../middleware/app.middleware.ts";
import type {GameQueryRepositoryInterface} from "../../repository/query/games.repository.ts";
import {v} from "convex/values";

export const getNonFinishedForSession = appQuery({
    visibility: "public", security: "public",
    args: {...SessionArgs},
    handler: async (ctx, args): Promise<Game[]> => {
        const gamesQuery: GameQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface")
        return await gamesQuery.findNonFinishedGamesForSessionId(args.sessionId);
    }
});

export const get = appQuery({
    visibility: "public", security: "secure",
    args: {gameToken: v.string()},
    handler: async (ctx, args): Promise<Game | null> => {
        const gamesQuery: GameQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface")
        return await gamesQuery.findByToken(args.gameToken);
    }
});
