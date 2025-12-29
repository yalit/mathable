import type {GameQueryRepositoryInterface} from "../../repository/query/games.repository";
import type {MovesQueryRepositoryInterface} from "../../repository/query/moves.repository";
import type {MovesMutationRepositoryInterface} from "../../repository/mutations/moves.repository";
import {Cell} from "../../domain/models/Cell.ts";
import type {AppMutationCtx} from "../../infrastructure/middleware/app.middleware.ts";
import type {Tile} from "../../domain/models/Tile.ts";
import type {Player} from "../../domain/models/Player.ts";
import type {User} from "../../domain/models/User.ts";
import {TileMoveService} from "../../domain/services/Tile/TileMove.service.ts";
import {ScoreService} from "../../domain/services/Play/Score.service.ts";
import {CellValueComputationService} from "../../domain/services/Cell/CellValueComputation.service.ts";

/**
 * DisplaceTileUseCase
 * Orchestrates moving a tile from one cell to another cell
 * This is only allowed for tiles placed in the current turn (Last-Move-Only approach)
 * Throws errors for validation failures
 */
export class DisplaceTileUseCase {
    private readonly ctx: AppMutationCtx;
    private readonly gamesQuery: GameQueryRepositoryInterface
    private readonly movesQuery: MovesQueryRepositoryInterface
    private readonly movesMutation: MovesMutationRepositoryInterface
    private readonly tileMoveService: TileMoveService
    private readonly moveScoreService: ScoreService
    private readonly cellComputationService: CellValueComputationService

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
        this.gamesQuery = this.ctx.container.get("GameQueryRepositoryInterface");
        this.movesQuery = this.ctx.container.get("MovesQueryRepositoryInterface");
        this.movesMutation = this.ctx.container.get("MovesMutationRepositoryInterface");
        this.tileMoveService = new TileMoveService(this.ctx)
        this.moveScoreService = new ScoreService(this.ctx)
        this.cellComputationService = new CellValueComputationService(this.ctx)
    }

    async execute(
        tile: Tile,
        fromCell: Cell,
        toCell: Cell,
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
            throw new Error("You can only move tiles during your turn");
        }

        // 3. Validate it's player's turn
        if (!game.isPlayerTurn(player)) {
            throw new Error("It's not your turn");
        }

        // 4. Validate tile is on the source cell (using domain logic)
        if (!tile.isOnBoard() || tile.cellId !== fromCell.id) {
            throw new Error("Tile is not on the source cell");
        }

        // 5. Validate source cell has the tile
        if (fromCell.tileId !== tile.id) {
            throw new Error("Source cell does not contain this tile");
        }

        // 6. Validate destination cell is empty
        if (toCell.hasTile()) {
            throw new Error("Destination cell already has a tile");
        }

        // 7. Validate tile value is allowed on destination cell
        if (!toCell.isValueAllowed(tile.value)) {
            throw new Error("This tile value is not allowed on the destination cell");
        }

        // 8. Validate tile can be displaced (Last-Move-Only approach)
        // The tile must have been placed in the current turn
        const movesForTurn = await this.movesQuery.findAllForCurrentTurn(game);
        const tileWasPlacedThisTurn = movesForTurn.some(move => {
            return move.tileId === tile.id && move.isPlayerToCell();
        });

        if (!tileWasPlacedThisTurn) {
            throw new Error("Can only displace tiles placed in the current turn");
        }

        // 9. Move tile from source to destination cell
        // The moveToCell internal mutation now handles removing from old cell
        // and adding to new cell automatically
        await this.tileMoveService.moveToCell(tile, toCell, player)

        // 10. Calculate new score for the new position
        const moveScore = this.moveScoreService.computeMoveScore(toCell, tile)

        // 11. Update the move record (find and update the existing move)
        const moveToUpdate = movesForTurn.find(move => {
            return move.tileId === tile.id && move.isPlayerToCell();
        });

        if (moveToUpdate) {
            // Create new move with updated cell and score
            await this.movesMutation.newPlayerToCell(game, tile, player, toCell, moveScore)

            // Delete old move
            await this.movesMutation.delete(moveToUpdate);
        }

        // 12. Recompute allowed values for both affected cells
        await this.cellComputationService.computeAllowedValuesForUpdatedCell(fromCell)
        await this.cellComputationService.computeAllowedValuesForUpdatedCell(toCell)
    }
}
