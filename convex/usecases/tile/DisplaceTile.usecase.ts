import { internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { TilesQueryRepository } from "../../repository/query/tiles.repository";
import { PlayersQueryRepository } from "../../repository/query/players.repository";
import { CellsQueryRepository } from "../../repository/query/cells.repository";
import { GamesQueryRepository } from "../../repository/query/games.repository";
import { MovesQueryRepository } from "../../repository/query/moves.repository";
import { MovesMutationRepository } from "../../repository/mutations/moves.repository";
import { CellsMutationRepository } from "../../repository/mutations/cells.repository";
import { TilesMutationRepository } from "../../repository/mutations/tiles.repository";
import { tileFromDoc } from "../../domain/models/factory/tile.factory";
import { playerFromDoc } from "../../domain/models/factory/player.factory";
import { cellFromDoc } from "../../domain/models/factory/cell.factory";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";
import { moveFromDoc, createPlayerToCellMove } from "../../domain/models/factory/move.factory";
import { countItems } from "../../helpers/array";

export interface DisplaceTileResult {
  success: boolean;
  error?: string;
}

/**
 * DisplaceTileUseCase
 * Orchestrates moving a tile from one cell to another cell
 * This is only allowed for tiles placed in the current turn (Last-Move-Only approach)
 */
export class DisplaceTileUseCase {
  private ctx: MutationCtx;

  constructor(ctx: MutationCtx) {
    this.ctx = ctx;
  }

  async execute(
    tileId: Id<"tiles">,
    fromCellId: Id<"cells">,
    toCellId: Id<"cells">,
    playerId: Id<"players">,
    userId: Id<"users">
  ): Promise<DisplaceTileResult> {
    // 1. Load entities
    const tileDoc = await TilesQueryRepository.instance.find(tileId);
    const playerDoc = await PlayersQueryRepository.instance.find(playerId);
    const fromCellDoc = await CellsQueryRepository.instance.find(fromCellId);
    const toCellDoc = await CellsQueryRepository.instance.find(toCellId);

    if (!tileDoc || !fromCellDoc || !toCellDoc || !playerDoc) {
      return {
        success: false,
        error: "Tile, cells, or player not found",
      };
    }

    // 2. Load domain models
    const tile = tileFromDoc(tileDoc);
    const player = playerFromDoc(playerDoc);
    const fromCell = cellFromDoc(fromCellDoc);
    const toCell = cellFromDoc(toCellDoc);

    // 3. Validate game context
    const gameDoc = await GamesQueryRepository.instance.find(tile.gameId);
    if (!gameDoc) {
      return {
        success: false,
        error: "Game not found",
      };
    }

    const game = createGameFromDoc(gameDoc);

    // 4. Validate user authorization
    if (!player.isSameUser(userId)) {
      return {
        success: false,
        error: "You can only move tiles during your turn",
      };
    }

    // 5. Validate it's player's turn
    if (!game.isPlayerTurn(player)) {
      return {
        success: false,
        error: "It's not your turn",
      };
    }

    // 6. Validate tile is on the source cell (using domain logic)
    if (!tile.isOnBoard() || tile.cellId !== fromCellId) {
      return {
        success: false,
        error: "Tile is not on the source cell",
      };
    }

    // 7. Validate source cell has the tile
    if (fromCell.tileId !== tileId) {
      return {
        success: false,
        error: "Source cell does not contain this tile",
      };
    }

    // 8. Validate destination cell is empty
    if (toCell.hasTile()) {
      return {
        success: false,
        error: "Destination cell already has a tile",
      };
    }

    // 9. Validate tile value is allowed on destination cell
    if (!toCell.isValueAllowed(tile.value)) {
      return {
        success: false,
        error: "This tile value is not allowed on the destination cell",
      };
    }

    // 10. Validate tile can be displaced (Last-Move-Only approach)
    // The tile must have been placed in the current turn
    const movesForTurn = await MovesQueryRepository.instance.findAllForCurrentTurn(gameDoc);
    const tileWasPlacedThisTurn = movesForTurn.some(moveDoc => {
      const move = moveFromDoc(moveDoc);
      return move.tileId === tileId && move.isPlayerToCell();
    });

    if (!tileWasPlacedThisTurn) {
      return {
        success: false,
        error: "Can only displace tiles placed in the current turn",
      };
    }

    // 11. Move tile from source to destination cell
    fromCell.setTileId(null);
    toCell.setTileId(tileId);
    await CellsMutationRepository.instance.save(fromCell);
    await CellsMutationRepository.instance.save(toCell);
    tile.moveToCell(toCellId, playerId);
    await TilesMutationRepository.instance.save(tile);

    // 12. Calculate new score for the new position
    const moveScore = this.calculateMoveScore(toCell, tile.value);

    // 13. Update the move record (find and update the existing move)
    const moveToUpdate = movesForTurn.find(moveDoc => {
      const move = moveFromDoc(moveDoc);
      return move.tileId === tileId && move.isPlayerToCell();
    });

    if (moveToUpdate) {
      // Create new move with updated cell and score
      const updatedMove = createPlayerToCellMove(
        game.id,
        game.currentTurn,
        tileId,
        playerId,
        toCellId,
        moveScore
      );
      await MovesMutationRepository.instance.save(updatedMove);

      // Delete old move
      await MovesMutationRepository.instance.delete(moveToUpdate._id);
    }

    // 14. Recompute allowed values for both affected cells
    await this.ctx.runMutation(
      internal.mutations.internal.cell.computeAllowedValuesFromUpdatedCell,
      { cellId: fromCellId }
    );
    await this.ctx.runMutation(
      internal.mutations.internal.cell.computeAllowedValuesFromUpdatedCell,
      { cellId: toCellId }
    );

    return {
      success: true,
    };
  }

  /**
   * Calculate the score for placing a tile on a cell
   */
  private calculateMoveScore(cell: typeof cellFromDoc extends (doc: any) => infer T ? T : never, tileValue: number): number {
    const occurrenceCount = countItems(cell.allowedValues as number[], tileValue);
    const baseScore = tileValue * occurrenceCount;

    if (cell.isMultiplierCell()) {
      return baseScore * cell.multiplier;
    }

    return baseScore;
  }
}
