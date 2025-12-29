import type {GameQueryRepositoryInterface} from "../../repository/query/games.repository";
import type {MovesMutationRepositoryInterface} from "../../repository/mutations/moves.repository";
import {Cell} from "../../domain/models/Cell.ts";
import type {AppMutationCtx} from "../../infrastructure/middleware/app.middleware.ts";
import type {Tile} from "../../domain/models/Tile.ts";
import type {User} from "../../domain/models/User.ts";
import type { Player } from "../../domain/models/Player.ts";
import {TileMoveService} from "../../domain/services/Tile/TileMove.service.ts";
import {ScoreService} from "../../domain/services/Play/Score.service.ts";
import {CellValueComputationService} from "../../domain/services/Cell/CellValueComputation.service.ts";

/**
 * PlaceTileUseCase
 * Orchestrates placing a tile from player's hand to a board cell
 * Throws errors for validation failures
 */
export class PlaceTileUseCase {
    private readonly ctx: AppMutationCtx;
    private readonly gamesQuery: GameQueryRepositoryInterface
    private readonly movesMutation: MovesMutationRepositoryInterface
    private readonly tileMoveService: TileMoveService
    private readonly scoreService: ScoreService
    private readonly cellComputationService: CellValueComputationService

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
        this.gamesQuery = this.ctx.container.get("GameQueryRepositoryInterface")
        this.movesMutation = this.ctx.container.get("MovesMutationRepositoryInterface");
        this.tileMoveService = new TileMoveService(this.ctx)
        this.scoreService = new ScoreService(this.ctx)
        this.cellComputationService = new CellValueComputationService(this.ctx)
    }

    async execute(
        tile: Tile,
        cell: Cell,
        player: Player,
        user: User
    ): Promise<void> {
        // 1. Validate game context
        const game = await this.gamesQuery.find(tile.gameId);
        if (!game) {
            throw new Error("Game not found");
        }

        // 2. Validate user authorization
        if (!player.isSameUser(user)) {
            throw new Error("You can only place your own tiles");
        }

        // 3. Validate it's player's turn
        if (!game.isPlayerTurn(player)) {
            throw new Error("It's not your turn");
        }

        // 4. Validate tile is in player's hand (using domain logic)
        if (!tile.isInHand() || !tile.belongsToPlayer(player)) {
            throw new Error("Tile must be in your hand");
        }

        // 5. Validate tile value is allowed on cell (using domain logic)
        if (!cell.isValueAllowed(tile.value)) {
            throw new Error("This tile value is not allowed on this cell");
        }

        // 6. Validate cell is empty (using domain logic)
        if (cell.hasTile()) {
            throw new Error("Cell already has a tile");
        }

        // 7. Move tile to cell (using internal mutation)
        await this.tileMoveService.moveToCell(tile, cell, player)

        // 8. Calculate and record the move with score
        const moveScore = this.scoreService.computeMoveScore(cell, tile)
        await this.movesMutation.newPlayerToCell(game, tile, player, cell, moveScore)

        // 9. Recompute allowed values for affected cells
        await this.cellComputationService.computeAllowedValuesForUpdatedCell(cell)
    }
}
