import { v } from "convex/values";
import { EndTurnUseCase } from "../../usecases/play/EndTurn.usecase";
import { ResetTurnUseCase } from "../../usecases/play/ResetTurn.usecase";
import { appMutation, SessionArgs } from "../../middleware/app.middleware.ts";

export const resetTurn = appMutation({
    visibility: "public", security: "secure",
    args: { gameId: v.id("games"), ...SessionArgs },
    handler: async (ctx, { gameId }) => {
        if (!ctx.user?.id) {
            throw new Error("User not authenticated");
        }

        const useCase = new ResetTurnUseCase(ctx, ctx.container);
        const result = await useCase.execute(gameId, ctx.user.id);

        if (!result.success) {
            throw new Error(result.error || "Failed to reset turn");
        }
    },
});

export const endTurn = appMutation({
    visibility: "public", security: "secure",
    args: { gameId: v.id("games"), ...SessionArgs },
    handler: async (ctx, { sessionId, gameId }) => {
        if (!ctx.user?.id) {
            throw new Error("User not authenticated");
        }

        const useCase = new EndTurnUseCase(ctx, ctx.container);
        const result = await useCase.execute(gameId, ctx.user.id, sessionId);

        if (!result.success) {
            throw new Error(result.error || "Failed to end turn");
        }
    },
});
