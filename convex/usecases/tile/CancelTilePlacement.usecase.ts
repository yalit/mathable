import type { GameQueryRepositoryInterface } from "../../repository/query/games.repository";
import type { MovesQueryRepositoryInterface } from "../../repository/query/moves.repository";
import { type MovesMutationRepositoryInterface } from "../../repository/mutations/moves.repository";
import type {AppMutationCtx} from "../../middleware/app.middleware.ts";
import type {Player} from "../../domain/models/Player.ts";
import type {User} from "../../domain/models/User.ts";
import {TileMoveService} from "../../domain/services/Tile/TileMove.service.ts";
import {CellValueComputationService} from "../../domain/services/Cell/CellValueComputation.service.ts";
import type {CellsQueryRepositoryInterface} from "../../repository/query/cells.repository.ts";
import type {TilesQueryRepositoryInterface} from "../../repository/query/tiles.repository.ts";

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
  ): Promise<CancelTilePlacementResult> {
    // 2. Load game
    const game = await this.gamesQuery.find(player.gameId);
    if (!game) {
      return this.error("Game not found")
    }

    // 3. Validate user authorization
    if (!player.isSameUser(user)) {
      return this.error("You can only cancel your own moves")
    }

    // 4. Validate it's player's turn
    if (!game.isPlayerTurn(player)) {
      return this.error("It's not your turn")
    }

    // 5. Get all moves for current turn
    const movesForTurn = await this.movesQuery.findAllForCurrentTurn(game);

    if (movesForTurn.length === 0) {
      return this.error("No moves to cancel")
    }

    // 6. Get the last move (Last-Move-Only approach)
    const lastMove = movesForTurn[movesForTurn.length - 1];

    // 7. Validate the move is cancellable (using domain logic)
    if (!lastMove.isCancellable()) {
      return this.error("Cannot cancel random tile draws (BAG_TO_PLAYER)")
    }

    // 8. Validate it's a PLAYER_TO_CELL move
    if (!lastMove.isPlayerToCell()) {
      return this.error("Last move is not a tile placement")
    }

    // 9. Validate move belongs to current player
    if (lastMove.playerId !== player.id) {
      return this.error("You can only cancel your own moves")
    }

    // 10. Get the tile and cell IDs
    if (!lastMove.tileId || !lastMove.cellId) {
      return this.error("Invalid move data");
    }

    const cell = await this.cellsQuery.find(lastMove.cellId)
    const tile = await this.tilesQuery.find(lastMove.tileId)
    if (!cell || !tile) {
      return this.error("Invalid move data");
    }

    // 11. Move tile back to player's hand
    await this.tileMoveService.moveToPlayer(tile, player)

    // 12. Recompute allowed values for the cell that was freed
    await this.cellComputationService.computeAllowedValuesForUpdatedCell(cell)

    // 13. Delete the move record
    await this.movesMutation.delete(lastMove);

    return {
      success: true,
    };
  }

  private error(text: string): CancelTilePlacementResult {
    return {
      success: false,
      error: text,
    }
  }
}