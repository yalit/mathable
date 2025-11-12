import { v } from "convex/values";
import { PlaceTileUseCase } from "../../usecases/tile/PlaceTile.usecase";
import { PickTileUseCase } from "../../usecases/tile/PickTile.usecase";
import { DisplaceTileUseCase } from "../../usecases/tile/DisplaceTile.usecase";
import { CancelTilePlacementUseCase } from "../../usecases/tile/CancelTilePlacement.usecase";
import { appMutation, SessionArgs } from "../../middleware/app.middleware.ts";

export const playToCell = appMutation({
    visibility: "public", security: "secure",
    args: {
        tileId: v.id("tiles"),
        cellId: v.id("cells"),
        playerId: v.id("players"),
        ...SessionArgs,
    },
    handler: async (ctx, { tileId, cellId, playerId }) => {
        if (!ctx.user?.id) {
            throw new Error("User not authenticated");
        }

        const useCase = new PlaceTileUseCase(ctx);
        const result = await useCase.execute(tileId, cellId, playerId, ctx.user.id);

        if (!result.success) {
            throw new Error(result.error || "Failed to place tile");
        }
    },
});

export const pick = appMutation({
    visibility: "public", security: "secure",
    args: {
        playerId: v.id("players"),
        ...SessionArgs,
    },
    handler: async (ctx, { playerId }) => {
        if (!ctx.user?.id) {
            throw new Error("User not authenticated");
        }

        const useCase = new PickTileUseCase(ctx);
        const result = await useCase.execute(playerId, ctx.user.id);

        if (!result.success) {
            throw new Error(result.error || "Failed to pick tile");
        }
    },
});

export const displace = appMutation({
    visibility: "public", security: "secure",
    args: {
        tileId: v.id("tiles"),
        fromCellId: v.id("cells"),
        toCellId: v.id("cells"),
        playerId: v.id("players"),
        ...SessionArgs,
    },
    handler: async (ctx, { tileId, fromCellId, toCellId, playerId }) => {
        if (!ctx.user?.id) {
            throw new Error("User not authenticated");
        }

        const useCase = new DisplaceTileUseCase(ctx);
        const result = await useCase.execute(tileId, fromCellId, toCellId, playerId, ctx.user.id);

        if (!result.success) {
            throw new Error(result.error || "Failed to displace tile");
        }
    },
});

export const cancelPlacement = appMutation({
    visibility: "public", security: "secure",
    args: {
        playerId: v.id("players"),
        ...SessionArgs,
    },
    handler: async (ctx, { playerId }) => {
        if (!ctx.user?.id) {
            throw new Error("User not authenticated");
        }

        const useCase = new CancelTilePlacementUseCase(ctx);
        const result = await useCase.execute(playerId, ctx.user.id);

        if (!result.success) {
            throw new Error(result.error || "Failed to cancel tile placement");
        }
    },
});
