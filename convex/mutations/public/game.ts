import { v } from "convex/values";
import { vSessionId } from "convex-helpers/server/sessions";
import { withSessionMutation } from "../../middleware/sessions";
import { withRepositoryMutation } from "../../middleware/repository.middleware.ts";
import { CreateGameUseCase } from "../../usecases/game/CreateGame.usecase.ts";
import { JoinGameUseCase } from "../../usecases/game/JoinGame.usecase.ts";
import { StartGameUseCase } from "../../usecases/game/StartGame.usecase.ts";

/**
 * Create a new game
 * Thin adapter that delegates to CreateGameUseCase
 */
export const create = withRepositoryMutation({
  args: { playerName: v.string(), sessionId: vSessionId },
  handler: async (ctx, args) => {
    const useCase = new CreateGameUseCase(ctx);
    return await useCase.execute(args.playerName, args.sessionId);
  },
});

/**
 * Join an existing game
 * Thin adapter that delegates to JoinGameUseCase
 */
export const join = withRepositoryMutation({
  args: {
    gameId: v.id("games"),
    playerName: v.string(),
    sessionId: vSessionId,
  },
  handler: async (ctx, args): Promise<{ success: boolean; token: string|null; error?: string }> => {
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
export const start = withSessionMutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    if (!ctx.user) {
      return { success: false, error: "User not authenticated" };
    }

    const useCase = new StartGameUseCase(ctx);
    return await useCase.execute(gameId, ctx.user._id);
  },
});

//TODO : implement endGame
export const endGame = {};
