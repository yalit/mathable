/**
 * Create a new game
 * Thin adapter that delegates to CreateGameUseCase
 */
import {appMutation, SessionArgs} from "../../infrastructure/middleware/app.middleware";
import {CreateGameUseCase} from "../../usecases/game/CreateGame.usecase.ts";
import {v, type Infer} from "convex/values";
import {APIReturn, APIError, APISuccess} from "../return.type.ts";
import {JoinGameUseCase} from "../../usecases/game/JoinGame.usecase.ts";
import {StartGameUseCase} from "../../usecases/game/StartGame.usecase.ts";
import type {GamesQueryRepositoryInterface} from "../../repository/query/games.repository.ts";

// Extract return validator for type inference
export const createGameReturn = APIReturn(v.object({
    gameToken: v.string(),
    playerToken: v.string(),
}));

export const create = appMutation({
    args: {playerName: v.string(), ...SessionArgs},
    returns: createGameReturn,
    handler: async (ctx, args): Promise<Infer<typeof createGameReturn>> => {
        const useCase = new CreateGameUseCase(ctx);
        const data = await useCase.execute(args.playerName, ctx.sessionId);
        return APISuccess(data);
    },
});

// Extract return validator for join mutation
const joinGameReturn = APIReturn(v.object({
    playerToken: v.string(),
}));

/**
 * Join an existing game
 * Thin adapter that delegates to JoinGameUseCase
 */
export const join = appMutation({
    args: {
        ...SessionArgs,
        gameId: v.id("games"),
        playerName: v.string(),
    },
    returns: joinGameReturn,
    handler: async (ctx, args): Promise<Infer<typeof joinGameReturn>> => {
        const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface")
        const game = await gamesQuery.find(args.gameId)
        if (!game) return APIError("No Game found");
        if (!ctx.user) return APIError("No User found");

        try {
            const useCase = new JoinGameUseCase(ctx);
            const playerToken = await useCase.execute(game, ctx.user, args.playerName);

            return APISuccess(playerToken);
        } catch (e: any) {
            return APIError(e.message);
        }
    },
});

// Extract return validator for start mutation (no data on success)
const startGameReturn = APIReturn(v.null());

/**
 * Start an existing game
 * Thin adapter that delegates to StartGameUseCase
 */
export const start = appMutation({
    args: {...SessionArgs, gameId: v.id("games")},
    returns: startGameReturn,
    handler: async (ctx, args): Promise<Infer<typeof startGameReturn>> => {
        const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface");
        const game = await gamesQuery.find(args.gameId);
        if (!game) return APIError("No Game found");
        if (!ctx.user) return APIError("User not authenticated");

        try {
            const useCase = new StartGameUseCase(ctx);
            await useCase.execute(game, ctx.user);

            return APISuccess(null);
        } catch (e: any) {
            return APIError(e.message);
        }
    },
});
