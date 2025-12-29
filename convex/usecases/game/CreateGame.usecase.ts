import type {SessionId} from "convex-helpers/server/sessions";
import type {GamesMutationRepositoryInterface} from "../../repository/mutations/games.repository";
import type {PlayersMutationRepositoryInterface} from "../../repository/mutations/players.repository";
import type {CellsMutationRepositoryInterface} from "../../repository/mutations/cells.repository";
import type {TilesMutationRepositoryInterface} from "../../repository/mutations/tiles.repository";
import {getBoardCells, getInitialGameTiles} from "../../domain/models/factory/game.factory.ts";
import type {Cell} from "../../domain/models/Cell.ts";
import {UUID} from "../../domain/models/factory/uuid.factory.ts";
import {createTile} from "../../domain/models/factory/tile.factory.ts";
import type {AppMutationCtx} from "../../middleware/app.middleware.ts";
import type {Game} from "../../domain/models/Game.ts";
import type {UsersQueryRepositoryInterface} from "../../repository/query/users.repository.ts";
import type {Player} from "../../domain/models/Player.ts";
import {CellValueComputationService} from "../../domain/services/Cell/CellValueComputation.service.ts";
import type {CellsQueryRepositoryInterface} from "../../repository/query/cells.repository.ts";

export interface CreateGameResult {
    gameToken: string;
    playerToken: string;
}

/**
 * CreateGameUseCase
 * Orchestrates the creation of a new game with all required setup
 */
export class CreateGameUseCase {
    private readonly ctx: AppMutationCtx;

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
    }

    private get gamesMutation(): GamesMutationRepositoryInterface {
        return this.ctx.container.get("GamesMutationRepositoryInterface");
    }

    private get playersMutation(): PlayersMutationRepositoryInterface {
        return this.ctx.container.get("PlayersMutationRepositoryInterface");
    }

    private get cellsQuery(): CellsQueryRepositoryInterface {
        return this.ctx.container.get("CellsQueryRepositoryInterface");
    }

    private get cellsMutation(): CellsMutationRepositoryInterface {
        return this.ctx.container.get("CellsMutationRepositoryInterface");
    }

    private get tilesMutation(): TilesMutationRepositoryInterface {
        return this.ctx.container.get("TilesMutationRepositoryInterface");
    }

    private get usersQuery(): UsersQueryRepositoryInterface {
        return this.ctx.container.get("UsersQueryRepositoryInterface");
    }

    async execute(
        playerName: string,
        sessionId: SessionId
    ): Promise<CreateGameResult> {
        // 1. Create game entity
        const game = await this.initializeGame();

        // 2. Create owner player
        const player = await this.initializeOwner(game, playerName, sessionId);

        // 3. Initialize game board
        await this.initializeBoard(game);

        // 4. Create initial tile set
        await this.createInitialTiles(game);

        // 5. Compute allowed values for all cells
        await this.computeAllowedValues(game);

        // 6. Retrieve created entities for return
        return {
            gameToken: game?.token ?? "",
            playerToken: player?.token ?? "",
        };
    }

    /**
     * Create the game entity
     */
    private async initializeGame(): Promise<Game> {
        return this.gamesMutation.new({
            token: UUID(),
            winner: undefined,
            status:  "waiting",
            currentTurn: 0
        });
    }

    /**
     * Create the owner player for the game
     */
    private async initializeOwner(
        game: Game,
        playerName: string,
        sessionId: SessionId
    ): Promise<Player> {
        const user = await this.usersQuery.findBySessionId(sessionId)
        if (!user) throw new Error("Invalid User");

        return this.playersMutation.newFromName(game, user, playerName)
    }

    /**
     * Initialize the game board with cells
     * Uses the factory to get the initial board structure
     */
    private async initializeBoard(game: Game): Promise<void> {
        const boardCells = getBoardCells(game);

        await Promise.all(
            boardCells.map((cell: Cell) => {
                this.cellsMutation.new(cell.toDoc())
            })
        );
    }

    /**
     * Create the initial set of tiles for the game
     * Uses the factory to get the initial tile configuration
     */
    private async createInitialTiles(game: Game): Promise<void> {
        const initialTiles = getInitialGameTiles(game);

        for (const tileData of initialTiles) {
            const tile = createTile(game, tileData.value, tileData.location);
            await this.tilesMutation.save(tile);
        }
    }

    /**
     * Compute allowed values for all cells on the board
     */
    private async computeAllowedValues(game: Game): Promise<void> {
        const cellComputationValueService = new CellValueComputationService(this.ctx)
        const cells = await this.cellsQuery.findAllForGame(game)

        for (const cell of cells) {
            await cellComputationValueService.computeAllowedValuesForCell(cell)
        }
    }
}
