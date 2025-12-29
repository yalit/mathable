/**
 * Play mutations controller
 * Thin adapters that delegate to play use cases
 */
import { appMutation, SessionArgs } from "../../middleware/app.middleware";
import { EndTurnUseCase } from "../../usecases/play/EndTurn.usecase";
import { ResetTurnUseCase } from "../../usecases/play/ResetTurn.usecase";
import { v, type Infer } from "convex/values";
import { APIReturn } from "../return.type";
import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository";
import type { PlayersQueryRepositoryInterface } from "../../repository/query/players.repository";

// Extract return validator for resetTurn mutation
const resetTurnReturn = APIReturn(v.object({
    movesReset: v.number(),
}));

/**
 * Reset the current turn by undoing all moves
 * Thin adapter that delegates to ResetTurnUseCase
 */
export const resetTurn = appMutation({
    visibility: "public", security: "secure",
    args: { gameId: v.id("games"), ...SessionArgs },
    returns: resetTurnReturn,
    handler: async (ctx, args): Promise<Infer<typeof resetTurnReturn>> => {
        const gamesQuery: GameQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface");
        const game = await gamesQuery.find(args.gameId);
        if (!game) return { status: "error", data: "No Game found" };
        if (!ctx.user) return { status: "error", data: "User not authenticated" };

        try {
            const useCase = new ResetTurnUseCase(ctx);
            const data = await useCase.execute(game, ctx.user);

            return {
                status: "success",
                data
            };
        } catch (e: any) {
            return { status: "error", data: e.message };
        }
    },
});

// Extract return validator for endTurn mutation
const endTurnReturn = APIReturn(v.object({
    gameEnded: v.boolean(),
}));

/**
 * End the current player's turn and transition to the next player
 * Thin adapter that delegates to EndTurnUseCase
 */
export const endTurn = appMutation({
    visibility: "public", security: "secure",
    args: { gameId: v.id("games"), ...SessionArgs },
    returns: endTurnReturn,
    handler: async (ctx, args): Promise<Infer<typeof endTurnReturn>> => {
        const gamesQuery: GameQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface");
        const game = await gamesQuery.find(args.gameId);
        if (!game) return { status: "error", data: "No Game found" };
        if (!ctx.user) return { status: "error", data: "User not authenticated" };

        const playersQuery: PlayersQueryRepositoryInterface = ctx.container.get("PlayersQueryRepositoryInterface");
        const currentPlayer = await playersQuery.findCurrentPlayer(game);
        if (!currentPlayer) return { status: "error", data: "No current player found" };

        try {
            const useCase = new EndTurnUseCase(ctx);
            const data = await useCase.execute(game, ctx.user, currentPlayer);

            return {
                status: "success",
                data
            };
        } catch (e: any) {
            return { status: "error", data: e.message };
        }
    },
});
