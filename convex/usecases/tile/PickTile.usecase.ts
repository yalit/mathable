import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { TilesQueryRepositoryInterface } from "../../repository/query/tiles.repository";
import type { PlayersQueryRepositoryInterface } from "../../repository/query/players.repository";
import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository";
import type { MovesMutationRepositoryInterface } from "../../repository/mutations/moves.repository";
import { playerFromDoc } from "../../domain/models/factory/player.factory";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";
import { createBagToPlayerMove } from "../../domain/models/factory/move.factory";
import type {AppMutationCtx} from "@cvx/middleware/app.middleware.ts";

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

  private get gamesQuery(): GameQueryRepositoryInterface {
    return this.ctx.container.get("GameQueryRepositoryInterface");
  }

  private get movesMutation(): MovesMutationRepositoryInterface {
    return this.ctx.container.get("MovesMutationRepositoryInterface");
  }

  async execute(
    playerId: Id<"players">,
    userId: Id<"users">
  ): Promise<PickTileResult> {
    // 1. Load player
    const playerDoc = await this.playersQuery.find(playerId);
    if (!playerDoc) {
      return {
        success: false,
        error: "Player not found",
      };
    }

    const player = playerFromDoc(playerDoc);

    // 2. Load game
    const gameDoc = await this.gamesQuery.find(player.gameId);
    if (!gameDoc) {
      return {
        success: false,
        error: "Game not found",
      };
    }

    const game = createGameFromDoc(gameDoc);

    // 2b Ensure game is instanciated
    if (!game.id) {
      return {
        success: false,
        error: "Game is not instanciated",
      }
    }
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
    const tilesInBag = await this.tilesQuery.findAllInBagByGame(
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
    const move = createBagToPlayerMove(
      game.id,
      game.currentTurn,
      pickedTile._id as Id<"tiles">,
      playerId
    );
    await this.movesMutation.save(move);

    return {
      success: true,
      tileId: pickedTile._id as Id<"tiles">,
    };
  }
}
