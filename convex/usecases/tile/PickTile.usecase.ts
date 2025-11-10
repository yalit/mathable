import { internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { TilesQueryRepository } from "../../repository/query/tiles.repository";
import { PlayersQueryRepository } from "../../repository/query/players.repository";
import { GamesQueryRepository } from "../../repository/query/games.repository";
import { playerFromDoc } from "../../domain/models/factory/player.factory";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";

export interface PickTileResult {
  success: boolean;
  tileId?: Id<"tiles">;
  error?: string;
}

/**
 * PickTileUseCase
 * Orchestrates picking a random tile from the bag and adding it to player's hand
 */
export class PickTileUseCase {
  private ctx: MutationCtx;

  constructor(ctx: MutationCtx) {
    this.ctx = ctx;
  }

  async execute(
    playerId: Id<"players">,
    userId: Id<"users">
  ): Promise<PickTileResult> {
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
        error: "You can only pick tiles for yourself",
      };
    }

    // 4. Validate it's player's turn
    if (!game.isPlayerTurn(player)) {
      return {
        success: false,
        error: "It's not your turn",
      };
    }

    // 5. Get available tiles from bag
    const tilesInBag = await TilesQueryRepository.instance.findAllInBagByGame(
      game.id
    );

    if (tilesInBag.length === 0) {
      return {
        success: false,
        error: "No tiles left in the bag",
      };
    }

    // 6. Pick a random tile
    tilesInBag.sort(() => Math.random() - 0.5);
    const pickedTile = tilesInBag[0];

    // 7. Move tile to player's hand
    await this.ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
      tileId: pickedTile._id as Id<"tiles">,
      playerId,
    });

    // 8. Record the move (BAG_TO_PLAYER is not cancellable due to randomness)
    await this.ctx.runMutation(internal.mutations.internal.move.createMove, {
      gameId: game.id,
      type: "BAG_TO_PLAYER",
      turn: game.currentTurn,
      tileId: pickedTile._id as Id<"tiles">,
      cellId: null,
      playerId,
      moveScore: 0, // No score for picking tiles
    });

    return {
      success: true,
      tileId: pickedTile._id as Id<"tiles">,
    };
  }
}
