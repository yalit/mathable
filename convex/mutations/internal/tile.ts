import { v } from "convex/values";
import { withRepositoryInternalMutation } from "../../middleware/repository.middleware.ts";
import { TilesQueryRepository } from "../../repository/query/tiles.repository.ts";
import { GamesQueryRepository } from "../../repository/query/games.repository.ts";
import { CellsQueryRepository } from "../../repository/query/cells.repository.ts";
import { CellsMutationRepository } from "../../repository/mutations/cells.repository.ts";
import { TilesMutationRepository } from "../../repository/mutations/tiles.repository.ts";

export const moveToPlayer = withRepositoryInternalMutation({
  args: {
    tileId: v.id("tiles"),
    playerId: v.id("players"),
  },
  handler: async (_, { tileId, playerId }) => {
    const tile = await TilesQueryRepository.instance.find(tileId);
    if (!tile) {
      return;
    }

    const game = await GamesQueryRepository.instance.find(tile.gameId);
    if (!game) {
      return;
    }
    // remove the tile from any Cell
    const cell = await CellsQueryRepository.instance.findByTile(tileId);

    if (cell !== null) {
      await CellsMutationRepository.instance.patch(cell._id, { tileId: null });
    }

    // move the tile to the player and change its status
    await TilesMutationRepository.instance.patch(tileId, {
      playerId,
      location: "in_hand",
      cellId: null,
    });
  },
});

export const moveToCell = withRepositoryInternalMutation({
  args: { tileId: v.id("tiles"), cellId: v.id("cells") },
  handler: async (_, { tileId, cellId }) => {
    // move the tile to cell
    await CellsMutationRepository.instance.patch(cellId, { tileId });
    // remove the tile from the player
    await TilesMutationRepository.instance.patch(tileId, {
      playerId: null,
      cellId,
      location: "on_board",
    });
  },
});

export const moveToBag = withRepositoryInternalMutation({
  args: { tileId: v.id("tiles") },
  handler: async (_, { tileId }) => {
    const tile = await TilesQueryRepository.instance.find(tileId);
    if (!tile) {
      return;
    }

    if (tile.cellId) {
      await CellsMutationRepository.instance.patch(tile.cellId, {
        tileId: null,
      });
    }

    await TilesMutationRepository.instance.patch(tileId, {
      cellId: null,
      playerId: null,
      location: "in_bag",
    });
  },
});
