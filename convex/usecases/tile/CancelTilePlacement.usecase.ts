import { internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { PlayersQueryRepository } from "../../repository/query/players.repository";
import { GamesQueryRepository } from "../../repository/query/games.repository";
import { MovesQueryRepository } from "../../repository/query/moves.repository";
import { MovesMutationRepository } from "../../repository/mutations/moves.repository";
import { playerFromDoc } from "../../domain/models/factory/player.factory";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";
import { moveFromDoc } from "../../domain/models/factory/move.factory";

export interface CancelTilePlacementResult {
  success: boolean;
  error?: string;
}

/**
 * CancelTilePlacementUseCase
 * Orchestrates cancelling the last tile placement (Last-Move-Only approach)
 * Moves tile from cell back to player's hand
 */
export class CancelTilePlacementUseCase {
  private ctx: MutationCtx;

  constructor(ctx: MutationCtx) {
    this.ctx = ctx;
  }

  async execute(
    playerId: Id<"players">,
    userId: Id<"users">
  ): Promise<CancelTilePlacementResult> {
    // 1. Load player
    const playerDoc = await PlayersQueryRepository.instance.find(playerId);
    if (!playerDoc) {
      return {
        success: false,
        error: "Player not found",
      };
    }

    const player = playerFromDoc(playerDoc);

    // 2. Load game
    const gameDoc = await GamesQueryRepository.instance.find(player.gameId);
    if (!gameDoc) {
      return {
        success: false,
        error: "Game not found",
      };
    }

    const game = createGameFromDoc(gameDoc);

    // 3. Validate user authorization
    if (!player.isSameUser(userId)) {
      return {
        success: false,
        error: "You can only cancel your own moves",
      };
    }

    // 4. Validate it's player's turn
    if (!game.isPlayerTurn(player)) {
      return {
        success: false,
        error: "It's not your turn",
      };
    }

    // 5. Get all moves for current turn
    const movesForTurn = await MovesQueryRepository.instance.findAllForCurrentTurn(gameDoc);

    if (movesForTurn.length === 0) {
      return {
        success: false,
        error: "No moves to cancel",
      };
    }

    // 6. Get the last move (Last-Move-Only approach)
    const lastMoveDoc = movesForTurn[movesForTurn.length - 1];
    const lastMove = moveFromDoc(lastMoveDoc);

    // 7. Validate the move is cancellable (using domain logic)
    if (!lastMove.isCancellable()) {
      return {
        success: false,
        error: "Cannot cancel random tile draws (BAG_TO_PLAYER)",
      };
    }

    // 8. Validate it's a PLAYER_TO_CELL move
    if (!lastMove.isPlayerToCell()) {
      return {
        success: false,
        error: "Last move is not a tile placement",
      };
    }

    // 9. Validate move belongs to current player
    if (lastMove.playerId !== playerId) {
      return {
        success: false,
        error: "You can only cancel your own moves",
      };
    }

    // 10. Get the tile and cell IDs
    if (!lastMove.tileId || !lastMove.cellId) {
      return {
        success: false,
        error: "Invalid move data",
      };
    }

    // 11. Move tile back to player's hand
    await this.ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
      tileId: lastMove.tileId,
      playerId,
    });

    // 12. Recompute allowed values for the cell that was freed
    await this.ctx.runMutation(
      internal.mutations.internal.cell.computeAllowedValuesFromUpdatedCell,
      { cellId: lastMove.cellId }
    );

    // 13. Delete the move record
    await MovesMutationRepository.instance.delete(lastMoveDoc._id);

    return {
      success: true,
    };
  }
}
