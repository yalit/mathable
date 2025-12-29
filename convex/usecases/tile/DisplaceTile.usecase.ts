import type {GameQueryRepositoryInterface} from "../../repository/query/games.repository";
import type {MovesQueryRepositoryInterface} from "../../repository/query/moves.repository";
import type {MovesMutationRepositoryInterface} from "../../repository/mutations/moves.repository";
import {Cell} from "../../domain/models/Cell.ts";
import type {AppMutationCtx} from "../../middleware/app.middleware.ts";
import type {Tile} from "../../domain/models/Tile.ts";
import type {Player} from "../../domain/models/Player.ts";
import type {User} from "../../domain/models/User.ts";
import {TileMoveService} from "../../domain/services/Tile/TileMove.service.ts";
import {ScoreService} from "../../domain/services/Play/Score.service.ts";
import {CellValueComputationService} from "../../domain/services/Cell/CellValueComputation.service.ts";

export interface DisplaceTileResult {
    success: boolean;
    error?: string;
}

/**
 * DisplaceTileUseCase
 * Orchestrates moving a tile from one cell to another cell
 * This is only allowed for tiles placed in the current turn (Last-Move-Only approach)
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
    ): Promise<DisplaceTileResult> {
        // 3. Validate game context
        const game = await this.gamesQuery.find(tile.gameId);
        if (!game) {
            return {
                success: false,
                error: "Game not found",
            };
        }

        // 4. Validate user authorization
        if (!player.isSameUser(user)) {
            return {
                success: false,
                error: "You can only move tiles during your turn",
            };
        }

        // 5. Validate it's player's turn
        if (!game.isPlayerTurn(player)) {
            return {
                success: false,
                error: "It's not your turn",
            };
        }

        // 6. Validate tile is on the source cell (using domain logic)
        if (!tile.isOnBoard() || tile.cellId !== fromCell.id) {
            return {
                success: false,
                error: "Tile is not on the source cell",
            };
        }

        // 7. Validate source cell has the tile
        if (fromCell.tileId !== tile.id) {
            return {
                success: false,
                error: "Source cell does not contain this tile",
            };
        }

        // 8. Validate destination cell is empty
        if (toCell.hasTile()) {
            return {
                success: false,
                error: "Destination cell already has a tile",
            };
        }

        // 9. Validate tile value is allowed on destination cell
        if (!toCell.isValueAllowed(tile.value)) {
            return {
                success: false,
                error: "This tile value is not allowed on the destination cell",
            };
        }

        // 10. Validate tile can be displaced (Last-Move-Only approach)
        // The tile must have been placed in the current turn
        const movesForTurn = await this.movesQuery.findAllForCurrentTurn(game);
        const tileWasPlacedThisTurn = movesForTurn.some(move => {
            return move.tileId === tile.id && move.isPlayerToCell();
        });

        if (!tileWasPlacedThisTurn) {
            return {
                success: false,
                error: "Can only displace tiles placed in the current turn",
            };
        }

        // 11. Move tile from source to destination cell
        // The moveToCell internal mutation now handles removing from old cell
        // and adding to new cell automatically
        await this.tileMoveService.moveToCell(tile, toCell, player)

        // 12. Calculate new score for the new position
        const moveScore = this.moveScoreService.computeMoveScore(toCell, tile)

        // 13. Update the move record (find and update the existing move)
        const moveToUpdate = movesForTurn.find(move => {
            return move.tileId === tile.id && move.isPlayerToCell();
        });

        if (moveToUpdate) {
            // Create new move with updated cell and score
            await this.movesMutation.newPlayerToCell(game, tile, player, toCell, moveScore)

            // Delete old move
            await this.movesMutation.delete(moveToUpdate);
        }

        // 14. Recompute allowed values for both affected cells
        await this.cellComputationService.computeAllowedValuesForUpdatedCell(fromCell)
        await this.cellComputationService.computeAllowedValuesForUpdatedCell(toCell)

        return {
            success: true,
        };
    }
}
