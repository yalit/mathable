import type {PlayersQueryRepositoryInterface} from "../../repository/query/players.repository";
import type {MovesQueryRepositoryInterface} from "../../repository/query/moves.repository";
import type {User} from "../../domain/models/User.ts";
import type {Game} from "../../domain/models/Game.ts";
import type {AppMutationCtx} from "../../middleware/app.middleware.ts";
import {CellValueComputationService} from "../../domain/services/Cell/CellValueComputation.service.ts";
import {TileMoveService} from "../../domain/services/Tile/TileMove.service.ts";
import type {TilesQueryRepositoryInterface} from "../../repository/query/tiles.repository.ts";
import type {CellsQueryRepositoryInterface} from "../../repository/query/cells.repository.ts";
import type {MovesMutationRepositoryInterface} from "../../repository/mutations/moves.repository.ts";

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
    private ctx: AppMutationCtx;
    private readonly playersQuery: PlayersQueryRepositoryInterface
    private readonly movesQuery: MovesQueryRepositoryInterface
    private readonly movesMutation: MovesMutationRepositoryInterface
    private readonly tilesQuery: TilesQueryRepositoryInterface
    private readonly cellsQuery: CellsQueryRepositoryInterface
    private readonly tileMoveService: TileMoveService
    private readonly cellComputationService: CellValueComputationService

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
        this.playersQuery = this.ctx.container.get("PlayersQueryRepositoryInterface")
        this.movesQuery = this.ctx.container.get("MovesQueryRepositoryInterface")
        this.movesMutation = this.ctx.container.get("MovesMutationRepositoryInterface")
        this.tilesQuery = this.ctx.container.get("TilesQueryRepositoryInterface")
        this.cellsQuery = this.ctx.container.get("CellsQueryRepositoryInterface")
        this.tileMoveService = new TileMoveService(this.ctx)
        this.cellComputationService = new CellValueComputationService(this.ctx)
    }

    async execute(
        game: Game,
        user: User
    ): Promise<ResetTurnResult> {

        // 3. Load current player
        const currentPlayer = await this.playersQuery.findCurrentPlayer(game);
        if (!currentPlayer) {
            return {
                success: false,
                error: "No current player found",
            };
        }

        // 4. Validate user authorization
        if (!currentPlayer.isSameUser(user)) {
            return {
                success: false,
                error: "Only the current player can reset their turn",
            };
        }

        // 5. Get all moves for the current turn
        const moves = await this.movesQuery.findAllForCurrentTurn(game);

        if (moves.length === 0) {
            return {
                success: true,
                movesReset: 0,
            };
        }

        // 6. Process moves in order and undo them
        let canContinue = true;
        let movesReset = 0;

        for (const move of moves) {
            if (!canContinue) {
                continue;
            }

            // Handle PLAYER_TO_CELL moves: move tiles back to player's hand
            if (move.isPlayerToCell()) {
                if (!(move.cellId && move.tileId && move.playerId)) {
                    continue;
                }

                const tile = await this.tilesQuery.find(move.tileId)
                if (!tile) continue
                const cell = await this.cellsQuery.find(move.cellId)
                if(!cell) continue
                const player = await this.playersQuery.find(move.playerId)
                if (!player) continue

                // Move tile back to player's hand
                await this.tileMoveService.moveToPlayer(tile, player)
                // Recompute allowed values for the cell that was freed
                await this.cellComputationService.computeAllowedValuesForUpdatedCell(cell)
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
            await this.movesMutation.delete(move);
        }

        return {
            success: true,
            movesReset,
        };
    }
}
