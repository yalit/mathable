import { internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { TilesQueryRepository } from "../../repository/query/tiles.repository";
import { PlayersQueryRepository } from "../../repository/query/players.repository";
import { CellsQueryRepository } from "../../repository/query/cells.repository";
import { GamesQueryRepository } from "../../repository/query/games.repository";
import { MovesMutationRepository } from "../../repository/mutations/moves.repository";
import { tileFromDoc } from "../../domain/models/factory/tile.factory";
import { playerFromDoc } from "../../domain/models/factory/player.factory";
import { cellFromDoc } from "../../domain/models/factory/cell.factory";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";
import { createPlayerToCellMove } from "../../domain/models/factory/move.factory";
import { countItems } from "../../helpers/array";

export interface PlaceTileResult {
  success: boolean;
  error?: string;
}

/**
 * PlaceTileUseCase
 * Orchestrates placing a tile from player's hand to a board cell
 */
export class PlaceTileUseCase {
  private ctx: MutationCtx;

  constructor(ctx: MutationCtx) {
    this.ctx = ctx;
  }

  async execute(
    tileId: Id<"tiles">,
    cellId: Id<"cells">,
    playerId: Id<"players">,
    userId: Id<"users">
  ): Promise<PlaceTileResult> {
    // 1. Load entities
    const tileDoc = await TilesQueryRepository.instance.find(tileId);
    const playerDoc = await PlayersQueryRepository.instance.find(playerId);
    const cellDoc = await CellsQueryRepository.instance.find(cellId);

    if (!tileDoc || !cellDoc || !playerDoc) {
      return {
        success: false,
        error: "Tile, cell, or player not found",
      };
    }

    // 2. Load domain models
    const tile = tileFromDoc(tileDoc);
    const player = playerFromDoc(playerDoc);
    const cell = cellFromDoc(cellDoc);

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
        error: "You can only place your own tiles",
      };
    }

    // 5. Validate it's player's turn
    if (!game.isPlayerTurn(player)) {
      return {
        success: false,
        error: "It's not your turn",
      };
    }

    // 6. Validate tile is in player's hand (using domain logic)
    if (!tile.isInHand() || !tile.belongsToPlayer(playerId)) {
      return {
        success: false,
        error: "Tile must be in your hand",
      };
    }

    // 7. Validate tile value is allowed on cell (using domain logic)
    if (!cell.isValueAllowed(tile.value)) {
      return {
        success: false,
        error: "This tile value is not allowed on this cell",
      };
    }

    // 8. Validate cell is empty (using domain logic)
    if (cell.hasTile()) {
      return {
        success: false,
        error: "Cell already has a tile",
      };
    }

    // 9. Move tile to cell (using internal mutation)
    await this.ctx.runMutation(internal.mutations.internal.tile.moveToCell, {
      tileId,
      cellId,
    });

    // 10. Calculate and record the move with score
    const moveScore = this.calculateMoveScore(cell, tile.value);
    await this.recordMove(game.id, game.currentTurn, tileId, cellId, playerId, moveScore);

    // 11. Recompute allowed values for affected cells
    await this.ctx.runMutation(
      internal.mutations.internal.cell.computeAllowedValuesFromUpdatedCell,
      { cellId }
    );

    return {
      success: true,
    };
  }

  /**
   * Calculate the score for placing a tile on a cell
   * Score = tile value * occurrence count * multiplier (if applicable)
   */
  private calculateMoveScore(cell: typeof cellFromDoc extends (doc: any) => infer T ? T : never, tileValue: number): number {
    const occurrenceCount = countItems(cell.allowedValues as number[], tileValue);
    const baseScore = tileValue * occurrenceCount;

    // Apply multiplier if cell is a MultiplierCell
    if (cell.isMultiplierCell()) {
      return baseScore * cell.multiplier;
    }

    return baseScore;
  }

  /**
   * Record the move in the moves table for tracking and undo
   */
  private async recordMove(
    gameId: Id<"games">,
    turn: number,
    tileId: Id<"tiles">,
    cellId: Id<"cells">,
    playerId: Id<"players">,
    moveScore: number
  ): Promise<void> {
    const move = createPlayerToCellMove(
      gameId,
      turn,
      tileId,
      playerId,
      cellId,
      moveScore
    );
    await MovesMutationRepository.instance.save(move);
  }
}
