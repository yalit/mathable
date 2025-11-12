import {v} from "convex/values";
import {appMutation, SessionArgs} from "../../middleware/app.middleware.ts";
import {CreateGameUseCase} from "../../usecases/game/CreateGame.usecase.ts";
import {JoinGameUseCase} from "../../usecases/game/JoinGame.usecase.ts";
import {StartGameUseCase} from "../../usecases/game/StartGame.usecase.ts";

/**
 * Create a new game
 * Thin adapter that delegates to CreateGameUseCase
 */

export const create = appMutation({
    visibility: "public", security: "public",
    args: {playerName: v.string(), ...SessionArgs},
    returns: v.object({
        gameToken: v.string(),
        playerToken: v.string(),
    }),
    handler: async (ctx, args) => {
        const useCase = new CreateGameUseCase(ctx);
        return await useCase.execute(args.playerName, args.sessionId);
    },
});

/**
 * Join an existing game
 * Thin adapter that delegates to JoinGameUseCase
 */
export const join = appMutation({
    visibility: "public", security: "public",
    args: {
        ...SessionArgs,
        gameId: v.id("games"),
        playerName: v.string(),
    },
    handler: async (ctx, args): Promise<{ success: boolean; token: string | null; error?: string }> => {
        const useCase = new JoinGameUseCase(ctx);
        const result = await useCase.execute(args.gameId, args.playerName, args.sessionId);

        return {
            success: result.success,
            token: result.playerToken,
            error: result.error,
        };
    },
});

/**
 * Start an existing game
 * Thin adapter that delegates to StartGameUseCase
 */
export const start = appMutation({
    visibility: "public", security: "secure",
    args: {...SessionArgs, gameId: v.id("games")},
    handler: async (ctx, {gameId}) => {
        if (!ctx.user) {
            return {success: false, error: "User not authenticated"};
        }

        const useCase = new StartGameUseCase(ctx);
        return await useCase.execute(gameId, ctx.user);
    },
});

//TODO : implement endGame
export const endGame = {};
