import { withSessionMutation } from "../../middleware/sessions";
import { vSessionId } from "convex-helpers/server/sessions";
import { v } from "convex/values";
import { PlaceTileUseCase } from "../../usecases/tile/PlaceTile.usecase";
import { PickTileUseCase } from "../../usecases/tile/PickTile.usecase";
import { DisplaceTileUseCase } from "../../usecases/tile/DisplaceTile.usecase";

export const playToCell = withSessionMutation({
    args: {
        tileId: v.id("tiles"),
        cellId: v.id("cells"),
        playerId: v.id("players"),
        sessionId: vSessionId,
    },
    handler: async (ctx, { tileId, cellId, playerId }) => {
        if (!ctx.user) {
            throw new Error("User not authenticated");
        }

        const useCase = new PlaceTileUseCase(ctx);
        const result = await useCase.execute(tileId, cellId, playerId, ctx.user._id);

        if (!result.success) {
            throw new Error(result.error || "Failed to place tile");
        }
    },
});

export const pick = withSessionMutation({
    args: {
        playerId: v.id("players"),
        sessionId: vSessionId,
    },
    handler: async (ctx, { playerId }) => {
        if (!ctx.user) {
            throw new Error("User not authenticated");
        }

        const useCase = new PickTileUseCase(ctx);
        const result = await useCase.execute(playerId, ctx.user._id);

        if (!result.success) {
            throw new Error(result.error || "Failed to pick tile");
        }
    },
});

export const displace = withSessionMutation({
    args: {
        tileId: v.id("tiles"),
        fromCellId: v.id("cells"),
        toCellId: v.id("cells"),
        playerId: v.id("players"),
        sessionId: vSessionId,
    },
    handler: async (ctx, { tileId, fromCellId, toCellId, playerId }) => {
        if (!ctx.user) {
            throw new Error("User not authenticated");
        }

        const useCase = new DisplaceTileUseCase(ctx);
        const result = await useCase.execute(tileId, fromCellId, toCellId, playerId, ctx.user._id);

        if (!result.success) {
            throw new Error(result.error || "Failed to displace tile");
        }
    },
});
