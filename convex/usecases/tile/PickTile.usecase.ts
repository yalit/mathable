import type { Id } from "../../_generated/dataModel";
import type { TilesQueryRepositoryInterface } from "../../repository/query/tiles.repository";
import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository";
import type { MovesMutationRepositoryInterface } from "../../repository/mutations/moves.repository";
import type {AppMutationCtx} from "../../infrastructure/middleware/app.middleware.ts";
import type {Player} from "../../domain/models/Player.ts";
import type {User} from "../../domain/models/User.ts";
import {TileMoveService} from "../../domain/services/Tile/TileMove.service.ts";

/**
 * PickTileUseCase
 * Orchestrates picking a random tile from the bag and adding it to player's hand
 * Throws errors for validation failures
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
  ): Promise<{tileId: Id<"tiles">}> {
    // 1. Load game
    const game = await this.gamesQuery.find(player.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // 2. Validate user authorization
    if (!player.isSameUser(user)) {
      throw new Error("You can only pick tiles for yourself");
    }

    // 3. Validate it's player's turn
    if (!game.isPlayerTurn(player)) {
      throw new Error("It's not your turn");
    }

    // 4. Get available tiles from bag
    const tilesInBag = await this.tilesQuery.findAllInBagByGame(game);

    if (tilesInBag.length === 0) {
      throw new Error("No tiles left in the bag");
    }

    // 5. Pick a random tile
    tilesInBag.sort(() => Math.random() - 0.5);
    const pickedTile = tilesInBag[0];

    // 6. Move tile to player's hand
    await this.tileMoveService.moveToPlayer(pickedTile, player)

    // 7. Record the move (BAG_TO_PLAYER is not cancellable due to randomness)
    await this.movesMutation.newPlayerToBag(game, pickedTile, player)

    return {tileId: pickedTile.id};
  }
}
