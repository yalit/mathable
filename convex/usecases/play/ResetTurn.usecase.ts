import { internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { ServiceContainer } from "../../infrastructure/ServiceContainer";
import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository";
import type { PlayersQueryRepositoryInterface } from "../../repository/query/players.repository";
import type { MovesQueryRepositoryInterface } from "../../repository/query/moves.repository";
import type { MovesMutationRepositoryInterface } from "../../repository/mutations/moves.repository";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";
import { playerFromDoc } from "../../domain/models/factory/player.factory";
import { moveFromDoc } from "../../domain/models/factory/move.factory";

export interface ResetTurnResult {
  success: boolean;
  error?: string;
  movesReset?: number;
}

/**
 * ResetTurnUseCase
 * Orchestrates resetting the current turn by undoing all moves
 * Stops if a BAG_TO_PLAYER move is encountered (random draws can't be undone)
 *
 * Uses dependency injection for all repository access via ServiceContainer
 */
export class ResetTurnUseCase {
  private ctx: MutationCtx;
  private container: ServiceContainer;

  constructor(ctx: MutationCtx, container: ServiceContainer) {
    this.ctx = ctx;
    this.container = container;
  }

  async execute(
    gameId: Id<"games">,
    userId: Id<"users">
  ): Promise<ResetTurnResult> {
    // Get repositories from container
    const gamesQuery = this.container.get<GameQueryRepositoryInterface>("GameQueryRepositoryInterface");
    const playersQuery = this.container.get<PlayersQueryRepositoryInterface>("PlayersQueryRepositoryInterface");
    const movesQuery = this.container.get<MovesQueryRepositoryInterface>("MovesQueryRepositoryInterface");
    const movesMutation = this.container.get<MovesMutationRepositoryInterface>("MovesMutationRepositoryInterface");

    // 1. Load game
    const gameDoc = await gamesQuery.find(gameId);
    if (!gameDoc) {
      return {
        success: false,
        error: "Game not found",
      };
    }

    const game = createGameFromDoc(gameDoc);

    // 2. Validate game is instantiated
    if (!game.id) {
      return {
        success: false,
        error: "Game not instantiated",
      };
    }

    // 3. Load current player
    const currentPlayerDoc = await playersQuery.findCurrentPlayer(game.id);
    if (!currentPlayerDoc) {
      return {
        success: false,
        error: "No current player found",
      };
    }

    const currentPlayer = playerFromDoc(currentPlayerDoc);

    // 4. Validate user authorization
    if (!currentPlayer.isSameUser(userId)) {
      return {
        success: false,
        error: "Only the current player can reset their turn",
      };
    }

    // 5. Get all moves for the current turn
    const moves = await movesQuery.findAllForCurrentTurn(gameDoc);

    if (moves.length === 0) {
      return {
        success: true,
        movesReset: 0,
      };
    }

    // 6. Process moves in order and undo them
    let canContinue = true;
    let movesReset = 0;

    for (const moveDoc of moves) {
      if (!canContinue) {
        continue;
      }

      const move = moveFromDoc(moveDoc);

      // Handle PLAYER_TO_CELL moves: move tiles back to player's hand
      if (move.isPlayerToCell()) {
        if (!(move.cellId && move.tileId && move.playerId)) {
          continue;
        }

        // Move tile back to player's hand
        await this.ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
          tileId: move.tileId,
          playerId: move.playerId,
        });

        // Recompute allowed values for the cell that was freed
        await this.ctx.runMutation(
          internal.mutations.internal.cell.computeAllowedValuesFromUpdatedCell,
          { cellId: move.cellId },
        );

        movesReset++;
      }

      // Handle BAG_TO_PLAYER moves: stop reset (can't undo random draws)
      if (move.isBagToPlayer()) {
        if (!move.tileId) {
          continue;
        }
        // If a tile was moved from the bag to the player during a turn,
        // it means the player played on an operator cell and fetched a new tile.
        // In that case, stop the reset as it would contravene the randomness of the game.
        canContinue = false;
        continue;
      }

      // Delete the move record
      await movesMutation.delete(moveDoc._id);
    }

    return {
      success: true,
      movesReset,
    };
  }
}
