import { v } from "convex/values";
import { withRepositoryInternalMutation } from "../../middleware/repository.middleware.ts";
import { TilesQueryRepository } from "../../repository/query/tiles.repository.ts";
import { GamesQueryRepository } from "../../repository/query/games.repository.ts";
import { CellsQueryRepository } from "../../repository/query/cells.repository.ts";
import { CellsMutationRepository } from "../../repository/mutations/cells.repository.ts";
import { TilesMutationRepository } from "../../repository/mutations/tiles.repository.ts";
import { cellFromDoc } from "../../domain/models/factory/cell.factory.ts";
import { tileFromDoc } from "../../domain/models/factory/tile.factory.ts";

export const moveToPlayer = withRepositoryInternalMutation({
  args: {
    tileId: v.id("tiles"),
    playerId: v.id("players"),
  },
  handler: async (_, { tileId, playerId }) => {
    const tileDoc = await TilesQueryRepository.instance.find(tileId);
    if (!tileDoc) {
      return;
    }

    const game = await GamesQueryRepository.instance.find(tileDoc.gameId);
    if (!game) {
      return;
    }
    // remove the tile from any Cell
    const cellDoc = await CellsQueryRepository.instance.findByTile(tileId);

    if (cellDoc !== null) {
      const cell = cellFromDoc(cellDoc);
      cell.setTileId(null);
      await CellsMutationRepository.instance.save(cell);
    }

    // move the tile to the player and change its status
    const tile = tileFromDoc(tileDoc);
    tile.moveToPlayer(playerId);
    await TilesMutationRepository.instance.save(tile);
  },
});

export const moveToCell = withRepositoryInternalMutation({
  args: { tileId: v.id("tiles"), cellId: v.id("cells"), playerId: v.id("players") },
  handler: async (_, { tileId, cellId, playerId }) => {
    const tileDoc = await TilesQueryRepository.instance.find(tileId);
    if (!tileDoc) {
      return;
    }

    // Handle tile coming from another cell (displacement)
    // If tile is currently on a cell, remove it from the old cell
    if (tileDoc.cellId) {
      const oldCellDoc = await CellsQueryRepository.instance.find(tileDoc.cellId);
      if (oldCellDoc) {
        const oldCell = cellFromDoc(oldCellDoc);
        oldCell.setTileId(null);
        await CellsMutationRepository.instance.save(oldCell);
      }
    }

    // Set tile on the new cell
    const newCellDoc = await CellsQueryRepository.instance.find(cellId);
    if (newCellDoc) {
      const newCell = cellFromDoc(newCellDoc);
      newCell.setTileId(tileId);
      await CellsMutationRepository.instance.save(newCell);
    }

    // Update tile location (handles both from hand and from cell)
    const tile = tileFromDoc(tileDoc);
    tile.moveToCell(cellId, playerId);
    await TilesMutationRepository.instance.save(tile);
  },
});

export const moveToBag = withRepositoryInternalMutation({
  args: { tileId: v.id("tiles") },
  handler: async (_, { tileId }) => {
    const tileDoc = await TilesQueryRepository.instance.find(tileId);
    if (!tileDoc) {
      return;
    }

    // Handle tile coming from cell - remove from cell
    if (tileDoc.cellId) {
      const cellDoc = await CellsQueryRepository.instance.find(tileDoc.cellId);
      if (cellDoc) {
        const cell = cellFromDoc(cellDoc);
        cell.setTileId(null);
        await CellsMutationRepository.instance.save(cell);
      }
    }

    // Handle tile coming from player's hand - no additional cleanup needed
    // (tile.playerId will be cleared by moveToBag())

    const tile = tileFromDoc(tileDoc);
    tile.moveToBag();
    await TilesMutationRepository.instance.save(tile);
  },
});
