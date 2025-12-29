import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository";
import type { MovesQueryRepositoryInterface } from "../../repository/query/moves.repository";
import { type MovesMutationRepositoryInterface } from "../../repository/mutations/moves.repository";
import type {AppMutationCtx} from "../../infrastructure/middleware/app.middleware.ts";
import type {Player} from "../../domain/models/Player.ts";
import type {User} from "../../domain/models/User.ts";
import {TileMoveService} from "../../domain/services/Tile/TileMove.service.ts";
import {CellValueComputationService} from "../../domain/services/Cell/CellValueComputation.service.ts";
import type {CellsQueryRepositoryInterface} from "../../repository/query/cells.repository.ts";
import type {TilesQueryRepositoryInterface} from "../../repository/query/tiles.repository.ts";

/**
 * CancelTilePlacementUseCase
 * Orchestrates cancelling the last tile placement (Last-Move-Only approach)
 * Moves tile from cell back to player's hand
 * Throws errors for validation failures
 */
export class CancelTilePlacementUseCase {
  private readonly ctx: AppMutationCtx;
  private readonly gamesQuery: GameQueryRepositoryInterface
  private readonly movesQuery: MovesQueryRepositoryInterface
  private readonly movesMutation: MovesMutationRepositoryInterface
  private readonly cellsQuery: CellsQueryRepositoryInterface
  private readonly tilesQuery: TilesQueryRepositoryInterface
  private readonly tileMoveService: TileMoveService
  private readonly cellComputationService: CellValueComputationService

  constructor(ctx: AppMutationCtx) {
    this.ctx = ctx;
    this.gamesQuery = this.ctx.container.get("GameQueryRepositoryInterface");
    this.movesQuery = this.ctx.container.get("MovesQueryRepositoryInterface");
    this.movesMutation = this.ctx.container.get("MovesMutationRepositoryInterface");
    this.cellsQuery = this.ctx.container.get("CellQueryRepositoryInterface");
    this.tilesQuery = this.ctx.container.get("TileQueryRepositoryInterface");
    this.tileMoveService = new TileMoveService(this.ctx)
    this.cellComputationService = new CellValueComputationService(this.ctx)
  }

  async execute(
      player: Player,
      user: User
  ): Promise<void> {
    // 1. Load game
    const game = await this.gamesQuery.find(player.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // 2. Validate user authorization
    if (!player.isSameUser(user)) {
      throw new Error("You can only cancel your own moves");
    }

    // 3. Validate it's player's turn
    if (!game.isPlayerTurn(player)) {
      throw new Error("It's not your turn");
    }

    // 4. Get all moves for current turn
    const movesForTurn = await this.movesQuery.findAllForCurrentTurn(game);

    if (movesForTurn.length === 0) {
      throw new Error("No moves to cancel");
    }

    // 5. Get the last move (Last-Move-Only approach)
    const lastMove = movesForTurn[movesForTurn.length - 1];

    // 6. Validate the move is cancellable (using domain logic)
    if (!lastMove.isCancellable()) {
      throw new Error("Cannot cancel random tile draws (BAG_TO_PLAYER)");
    }

    // 7. Validate it's a PLAYER_TO_CELL move
    if (!lastMove.isPlayerToCell()) {
      throw new Error("Last move is not a tile placement");
    }

    // 8. Validate move belongs to current player
    if (lastMove.playerId !== player.id) {
      throw new Error("You can only cancel your own moves");
    }

    // 9. Get the tile and cell IDs
    if (!lastMove.tileId || !lastMove.cellId) {
      throw new Error("Invalid move data");
    }

    const cell = await this.cellsQuery.find(lastMove.cellId)
    const tile = await this.tilesQuery.find(lastMove.tileId)
    if (!cell || !tile) {
      throw new Error("Invalid move data");
    }

    // 10. Move tile back to player's hand
    await this.tileMoveService.moveToPlayer(tile, player)

    // 11. Recompute allowed values for the cell that was freed
    await this.cellComputationService.computeAllowedValuesForUpdatedCell(cell)

    // 12. Delete the move record
    await this.movesMutation.delete(lastMove);
  }
}