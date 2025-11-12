import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { TilesQueryRepositoryInterface } from "../../repository/query/tiles.repository";
import type { PlayersQueryRepositoryInterface } from "../../repository/query/players.repository";
import type { CellsQueryRepositoryInterface } from "../../repository/query/cells.repository";
import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository";
import type { MovesQueryRepositoryInterface } from "../../repository/query/moves.repository";
import type { MovesMutationRepositoryInterface } from "../../repository/mutations/moves.repository";
import { tileFromDoc } from "../../domain/models/factory/tile.factory";
import { playerFromDoc } from "../../domain/models/factory/player.factory";
import { cellFromDoc } from "../../domain/models/factory/cell.factory";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";
import { moveFromDoc, createPlayerToCellMove } from "../../domain/models/factory/move.factory";
import { countItems } from "../../helpers/array";
import {Cell} from "../../domain/models/Cell.ts";
import type {AppMutationCtx} from "@cvx/middleware/app.middleware.ts";

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
  private ctx: AppMutationCtx;

  constructor(ctx: AppMutationCtx) {
    this.ctx = ctx;
  }

  private get tilesQuery(): TilesQueryRepositoryInterface {
    return this.ctx.container.get("TilesQueryRepositoryInterface");
  }

  private get playersQuery(): PlayersQueryRepositoryInterface {
    return this.ctx.container.get("PlayersQueryRepositoryInterface");
  }

  private get cellsQuery(): CellsQueryRepositoryInterface {
    return this.ctx.container.get("CellsQueryRepositoryInterface");
  }

  private get gamesQuery(): GameQueryRepositoryInterface {
    return this.ctx.container.get("GameQueryRepositoryInterface");
  }

  private get movesQuery(): MovesQueryRepositoryInterface {
    return this.ctx.container.get("MovesQueryRepositoryInterface");
  }

  private get movesMutation(): MovesMutationRepositoryInterface {
    return this.ctx.container.get("MovesMutationRepositoryInterface");
  }

  async execute(
    tileId: Id<"tiles">,
    fromCellId: Id<"cells">,
    toCellId: Id<"cells">,
    playerId: Id<"players">,
    userId: Id<"users">
  ): Promise<DisplaceTileResult> {
    // 1. Load entities
    const tileDoc = await this.tilesQuery.find(tileId);
    const playerDoc = await this.playersQuery.find(playerId);
    const fromCellDoc = await this.cellsQuery.find(fromCellId);
    const toCellDoc = await this.cellsQuery.find(toCellId);

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
    const gameDoc = await this.gamesQuery.find(tile.gameId);
    if (!gameDoc) {
      return {
        success: false,
        error: "Game not found",
      };
    }

    const game = createGameFromDoc(gameDoc);

    // 3b Ensure game is instanciated
    if (!game.id) {
      return {
        success: false,
        error: "Game not instanciated",
      }
    }

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
    const movesForTurn = await this.movesQuery.findAllForCurrentTurn(gameDoc);
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
    // The moveToCell internal mutation now handles removing from old cell
    // and adding to new cell automatically
    await this.ctx.runMutation(internal.mutations.internal.tile.moveToCell, {
      tileId,
      cellId: toCellId,
      playerId,
    });

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
      await this.movesMutation.save(updatedMove);

      // Delete old move
      await this.movesMutation.delete(moveToUpdate._id);
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
  private calculateMoveScore(cell: Cell, tileValue: number): number {
    const occurrenceCount = countItems(cell.allowedValues as number[], tileValue);
    const baseScore = tileValue * occurrenceCount;

    if (cell.isMultiplierCell()) {
      return baseScore * cell.multiplier;
    }

    return baseScore;
  }
}
