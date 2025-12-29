/**
 * Tile mutations controller
 * Thin adapters that delegate to tile use cases
 */
import { appMutation, SessionArgs } from "../../middleware/app.middleware";
import { PlaceTileUseCase } from "../../usecases/tile/PlaceTile.usecase";
import { PickTileUseCase } from "../../usecases/tile/PickTile.usecase";
import { DisplaceTileUseCase } from "../../usecases/tile/DisplaceTile.usecase";
import { CancelTilePlacementUseCase } from "../../usecases/tile/CancelTilePlacement.usecase";
import { v, type Infer } from "convex/values";
import { APIReturn, APIError, APISuccess } from "../return.type";
import type { TilesQueryRepositoryInterface } from "../../repository/query/tiles.repository";
import type { CellsQueryRepositoryInterface } from "../../repository/query/cells.repository";
import type { PlayersQueryRepositoryInterface } from "../../repository/query/players.repository";

// Extract return validator for playToCell mutation
const playToCellReturn = APIReturn(v.null());

/**
 * Place a tile from player's hand to a board cell
 * Thin adapter that delegates to PlaceTileUseCase
 */
export const playToCell = appMutation({
    visibility: "public", security: "secure",
    args: {
        tileId: v.id("tiles"),
        cellId: v.id("cells"),
        playerId: v.id("players"),
        ...SessionArgs,
    },
    returns: playToCellReturn,
    handler: async (ctx, args): Promise<Infer<typeof playToCellReturn>> => {
        const tilesQuery: TilesQueryRepositoryInterface = ctx.container.get("TilesQueryRepositoryInterface");
        const tile = await tilesQuery.find(args.tileId);
        if (!tile) return APIError("Tile not found");

        const cellsQuery: CellsQueryRepositoryInterface = ctx.container.get("CellsQueryRepositoryInterface");
        const cell = await cellsQuery.find(args.cellId);
        if (!cell) return APIError("Cell not found");

        const playersQuery: PlayersQueryRepositoryInterface = ctx.container.get("PlayersQueryRepositoryInterface");
        const player = await playersQuery.find(args.playerId);
        if (!player) return APIError("Player not found");

        if (!ctx.user) return APIError("User not authenticated");

        try {
            const useCase = new PlaceTileUseCase(ctx);
            await useCase.execute(tile, cell, player, ctx.user);

            return APISuccess(null);
        } catch (e: any) {
            return APIError(e.message);
        }
    },
});

// Extract return validator for pick mutation
const pickReturn = APIReturn(v.object({
    tileId: v.id("tiles"),
}));

/**
 * Pick a random tile from the bag and add it to player's hand
 * Thin adapter that delegates to PickTileUseCase
 */
export const pick = appMutation({
    visibility: "public", security: "secure",
    args: {
        playerId: v.id("players"),
        ...SessionArgs,
    },
    returns: pickReturn,
    handler: async (ctx, args): Promise<Infer<typeof pickReturn>> => {
        const playersQuery: PlayersQueryRepositoryInterface = ctx.container.get("PlayersQueryRepositoryInterface");
        const player = await playersQuery.find(args.playerId);
        if (!player) return APIError("Player not found");

        if (!ctx.user) return APIError("User not authenticated");

        try {
            const useCase = new PickTileUseCase(ctx);
            const data = await useCase.execute(player, ctx.user);

            return APISuccess(data);
        } catch (e: any) {
            return APIError(e.message);
        }
    },
});

// Extract return validator for displace mutation
const displaceReturn = APIReturn(v.null());

/**
 * Move a tile from one cell to another cell (only for tiles placed in current turn)
 * Thin adapter that delegates to DisplaceTileUseCase
 */
export const displace = appMutation({
    visibility: "public", security: "secure",
    args: {
        tileId: v.id("tiles"),
        fromCellId: v.id("cells"),
        toCellId: v.id("cells"),
        playerId: v.id("players"),
        ...SessionArgs,
    },
    returns: displaceReturn,
    handler: async (ctx, args): Promise<Infer<typeof displaceReturn>> => {
        const tilesQuery: TilesQueryRepositoryInterface = ctx.container.get("TilesQueryRepositoryInterface");
        const tile = await tilesQuery.find(args.tileId);
        if (!tile) return APIError("Tile not found");

        const cellsQuery: CellsQueryRepositoryInterface = ctx.container.get("CellsQueryRepositoryInterface");
        const fromCell = await cellsQuery.find(args.fromCellId);
        if (!fromCell) return APIError("Source cell not found");

        const toCell = await cellsQuery.find(args.toCellId);
        if (!toCell) return APIError("Destination cell not found");

        const playersQuery: PlayersQueryRepositoryInterface = ctx.container.get("PlayersQueryRepositoryInterface");
        const player = await playersQuery.find(args.playerId);
        if (!player) return APIError("Player not found");

        if (!ctx.user) return APIError("User not authenticated");

        try {
            const useCase = new DisplaceTileUseCase(ctx);
            await useCase.execute(tile, fromCell, toCell, player, ctx.user);

            return APISuccess(null);
        } catch (e: any) {
            return APIError(e.message);
        }
    },
});

// Extract return validator for cancelPlacement mutation
const cancelPlacementReturn = APIReturn(v.null());

/**
 * Cancel the last tile placement (moves tile back to player's hand)
 * Thin adapter that delegates to CancelTilePlacementUseCase
 */
export const cancelPlacement = appMutation({
    visibility: "public", security: "secure",
    args: {
        playerId: v.id("players"),
        ...SessionArgs,
    },
    returns: cancelPlacementReturn,
    handler: async (ctx, args): Promise<Infer<typeof cancelPlacementReturn>> => {
        const playersQuery: PlayersQueryRepositoryInterface = ctx.container.get("PlayersQueryRepositoryInterface");
        const player = await playersQuery.find(args.playerId);
        if (!player) return APIError("Player not found");

        if (!ctx.user) return APIError("User not authenticated");

        try {
            const useCase = new CancelTilePlacementUseCase(ctx);
            await useCase.execute(player, ctx.user);

            return APISuccess(null);
        } catch (e: any) {
            return APIError(e.message);
        }
    },
});
