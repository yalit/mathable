/**
 * Tile mutations controller
 * Thin adapters that delegate to tile use cases
 */
import {
  appMutation,
  SessionArgs,
} from "../../infrastructure/middleware/app.middleware";
import { PlaceTileUseCase } from "../../usecases/tile/PlaceTile.usecase";
import { PickTileUseCase } from "../../usecases/tile/PickTile.usecase";
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
  args: {
    tileId: v.id("tiles"),
    cellId: v.id("cells"),
    playerId: v.id("players"),
    ...SessionArgs,
  },
  returns: playToCellReturn,
  handler: async (ctx, args): Promise<Infer<typeof playToCellReturn>> => {
    const tilesQuery: TilesQueryRepositoryInterface = ctx.container.get(
      "TilesQueryRepositoryInterface",
    );
    const tile = await tilesQuery.find(args.tileId);
    if (!tile) return APIError("Tile not found");

    const cellsQuery: CellsQueryRepositoryInterface = ctx.container.get(
      "CellsQueryRepositoryInterface",
    );
    const cell = await cellsQuery.find(args.cellId);
    if (!cell) return APIError("Cell not found");

    const playersQuery: PlayersQueryRepositoryInterface = ctx.container.get(
      "PlayersQueryRepositoryInterface",
    );
    const player = await playersQuery.find(args.playerId);
    if (!player) return APIError("Player not found");

    if (!ctx.user) return APIError("User not authenticated");

    try {
      const useCase = new PlaceTileUseCase(ctx);
      await useCase.execute(tile, cell, player, ctx.user);

      return new Promise((r) => r(APISuccess(null)));
    } catch (e: unknown) {
      const typedError = e as Error;
      return new Promise((r) => r(APIError(typedError.message)));
    }
  },
});

// Extract return validator for pick mutation
const pickReturn = APIReturn(
  v.object({
    tileId: v.id("tiles"),
  }),
);

/**
 * Pick a random tile from the bag and add it to player's hand
 * Thin adapter that delegates to PickTileUseCase
 */
export const pick = appMutation({
  args: {
    playerId: v.id("players"),
    ...SessionArgs,
  },
  returns: pickReturn,
  handler: async (ctx, args): Promise<Infer<typeof pickReturn>> => {
    const playersQuery: PlayersQueryRepositoryInterface = ctx.container.get(
      "PlayersQueryRepositoryInterface",
    );
    const player = await playersQuery.find(args.playerId);
    if (!player) return APIError("Player not found");

    if (!ctx.user) return APIError("User not authenticated");

    try {
      const useCase = new PickTileUseCase(ctx);
      const data = await useCase.execute(player, ctx.user);

      return APISuccess(data);
    } catch (e: unknown) {
      const typedError = e as Error;
      return APIError(typedError.message);
    }
  },
});
