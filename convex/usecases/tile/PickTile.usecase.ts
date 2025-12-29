import type { Id } from "../../_generated/dataModel";
import type { TilesQueryRepositoryInterface } from "../../repository/query/tiles.repository";
import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository";
import type { MovesMutationRepositoryInterface } from "../../repository/mutations/moves.repository";
import type {AppMutationCtx} from "../../middleware/app.middleware.ts";
import type {Player} from "../../domain/models/Player.ts";
import type {User} from "../../domain/models/User.ts";
import {TileMoveService} from "../../domain/services/Tile/TileMove.service.ts";

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
  private readonly ctx: AppMutationCtx;
  private readonly tilesQuery: TilesQueryRepositoryInterface
  private readonly gamesQuery: GameQueryRepositoryInterface
  private readonly movesMutation: MovesMutationRepositoryInterface
  private readonly tileMoveService: TileMoveService

  constructor(ctx: AppMutationCtx) {
    this.ctx = ctx;
    this.tilesQuery = this.ctx.container.get("TilesQueryRepositoryInterface");
    this.movesMutation = this.ctx.container.get("MovesMutationRepositoryInterface");
    this.gamesQuery = this.ctx.container.get("GameQueryRepositoryInterface");
    this.tileMoveService = new TileMoveService(this.ctx)
  }

  async execute(
      player: Player,
      user: User
  ): Promise<PickTileResult> {
    // 2. Load game
    const game = await this.gamesQuery.find(player.gameId);
    if (!game) {
      return {
        success: false,
        error: "Game not found",
      };
    }

    // 3. Validate user authorization
    if (!player.isSameUser(user)) {
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
    const tilesInBag = await this.tilesQuery.findAllInBagByGame(game);

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
    await this.tileMoveService.moveToPlayer(pickedTile, player)

    // 8. Record the move (BAG_TO_PLAYER is not cancellable due to randomness)
    await this.movesMutation.newPlayerToBag(game, pickedTile, player)

    return {
      success: true,
      tileId: pickedTile.id,
    };
  }
}
