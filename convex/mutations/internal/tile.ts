import { v } from "convex/values";
import type { TilesQueryRepositoryInterface } from "../../repository/query/tiles.repository.ts";
import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository.ts";
import type { CellsQueryRepositoryInterface } from "../../repository/query/cells.repository.ts";
import type { CellsMutationRepositoryInterface } from "../../repository/mutations/cells.repository.ts";
import type { TilesMutationRepositoryInterface } from "../../repository/mutations/tiles.repository.ts";
import { cellFromDoc } from "../../domain/models/factory/cell.factory.ts";
import { tileFromDoc } from "../../domain/models/factory/tile.factory.ts";
import {appMutation} from "../../middleware/app.middleware.ts";

export const moveToPlayer = appMutation({
  visibility: "internal", security: "internal",
  args: {
    tileId: v.id("tiles"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { tileId, playerId }) => {
    const tilesQueryRepository: TilesQueryRepositoryInterface = ctx.container.get("TilesQueryRepositoryInterface");
    const gamesQueryRepository: GameQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface");
    const cellsQueryRepository: CellsQueryRepositoryInterface = ctx.container.get("CellsQueryRepositoryInterface");
    const cellsMutationRepository: CellsMutationRepositoryInterface = ctx.container.get("CellsMutationRepositoryInterface");
    const tilesMutationRepository: TilesMutationRepositoryInterface = ctx.container.get("TilesMutationRepositoryInterface");

    const tileDoc = await tilesQueryRepository.find(tileId);
    if (!tileDoc) {
      return;
    }

    const game = await gamesQueryRepository.find(tileDoc.gameId);
    if (!game) {
      return;
    }
    // remove the tile from any Cell
    const cellDoc = await cellsQueryRepository.findByTile(tileId);

    if (cellDoc !== null) {
      const cell = cellFromDoc(cellDoc);
      cell.setTileId(null);
      await cellsMutationRepository.save(cell);
    }

    // move the tile to the player and change its status
    const tile = tileFromDoc(tileDoc);
    tile.moveToPlayer(playerId);
    await tilesMutationRepository.save(tile);
  },
});

export const moveToCell = appMutation({
  visibility: "internal", security: "internal",
  args: { tileId: v.id("tiles"), cellId: v.id("cells"), playerId: v.id("players") },
  handler: async (ctx, { tileId, cellId, playerId }) => {
    const tilesQueryRepository: TilesQueryRepositoryInterface = ctx.container.get("TilesQueryRepositoryInterface");
    const cellsQueryRepository: CellsQueryRepositoryInterface = ctx.container.get("CellsQueryRepositoryInterface");
    const cellsMutationRepository: CellsMutationRepositoryInterface = ctx.container.get("CellsMutationRepositoryInterface");
    const tilesMutationRepository: TilesMutationRepositoryInterface = ctx.container.get("TilesMutationRepositoryInterface");

    const tileDoc = await tilesQueryRepository.find(tileId);
    if (!tileDoc) {
      return;
    }

    // Handle tile coming from another cell (displacement)
    // If tile is currently on a cell, remove it from the old cell
    if (tileDoc.cellId) {
      const oldCellDoc = await cellsQueryRepository.find(tileDoc.cellId);
      if (oldCellDoc) {
        const oldCell = cellFromDoc(oldCellDoc);
        oldCell.setTileId(null);
        await cellsMutationRepository.save(oldCell);
      }
    }

    // Set tile on the new cell
    const newCellDoc = await cellsQueryRepository.find(cellId);
    if (newCellDoc) {
      const newCell = cellFromDoc(newCellDoc);
      newCell.setTileId(tileId);
      await cellsMutationRepository.save(newCell);
    }

    // Update tile location (handles both from hand and from cell)
    const tile = tileFromDoc(tileDoc);
    tile.moveToCell(cellId, playerId);
    await tilesMutationRepository.save(tile);
  },
});

export const moveToBag = appMutation({
  visibility: "internal", security: "internal",
  args: { tileId: v.id("tiles") },
  handler: async (ctx, { tileId }) => {
    const tilesQueryRepository: TilesQueryRepositoryInterface = ctx.container.get("TilesQueryRepositoryInterface");
    const cellsQueryRepository: CellsQueryRepositoryInterface = ctx.container.get("CellsQueryRepositoryInterface");
    const cellsMutationRepository: CellsMutationRepositoryInterface = ctx.container.get("CellsMutationRepositoryInterface");
    const tilesMutationRepository: TilesMutationRepositoryInterface = ctx.container.get("TilesMutationRepositoryInterface");

    const tileDoc = await tilesQueryRepository.find(tileId);
    if (!tileDoc) {
      return;
    }

    // Handle tile coming from cell - remove from cell
    if (tileDoc.cellId) {
      const cellDoc = await cellsQueryRepository.find(tileDoc.cellId);
      if (cellDoc) {
        const cell = cellFromDoc(cellDoc);
        cell.setTileId(null);
        await cellsMutationRepository.save(cell);
      }
    }

    // Handle tile coming from player's hand - no additional cleanup needed
    // (tile.playerId will be cleared by moveToBag())

    const tile = tileFromDoc(tileDoc);
    tile.moveToBag();
    await tilesMutationRepository.save(tile);
  },
});
