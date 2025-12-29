import type {PlayersQueryRepositoryInterface} from "../../repository/query/players.repository";
import type {GamesMutationRepositoryInterface} from "../../repository/mutations/games.repository";
import type {PlayersMutationRepositoryInterface} from "../../repository/mutations/players.repository";
import type {User} from "../../domain/models/User.ts";
import type {AppMutationCtx} from "../../middleware/app.middleware.ts";
import type {Game} from "../../domain/models/Game.ts";
import { TileDistributionService } from "../../domain/services/Tile/TileDistribution.service.ts";

/**
 * StartGameUseCase
 * Orchestrates starting a game that's in waiting status
 * Throws errors for validation failures
 */
export class StartGameUseCase {
    private ctx: AppMutationCtx;

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
    }

    private get gamesMutation(): GamesMutationRepositoryInterface {
        return this.ctx.container.get("GamesMutationRepositoryInterface");
    }

    private get playersQuery(): PlayersQueryRepositoryInterface {
        return this.ctx.container.get("PlayersQueryRepositoryInterface");
    }

    private get playersMutation(): PlayersMutationRepositoryInterface {
        return this.ctx.container.get("PlayersMutationRepositoryInterface");
    }

    async execute(
        game: Game,
        user: User,
    ): Promise<void> {
        // 3. Load players
        const players = await this.playersQuery.findByGame(game);

        // 4. Validate user is the game owner
        const owner = players.find((p) => p.owner);
        if (!owner) {
            throw new Error("No game owner found");
        }

        if (user.id && !owner.isSameUser(user)) {
            throw new Error("Only the game owner can start the game");
        }

        // 5. Validate game can be started (using domain logic)
        if (!game.canBeStartedBy(owner)) {
            throw new Error("Game cannot be started (must be in waiting status)");
        }

        // 6. Validate minimum players
        if (players.length < 2) {
            throw new Error("Need at least 2 players to start the game");
        }

        // 7. Start the game (using domain logic)
        game.start(players);

        // 8. Persist game state changes
        await this.gamesMutation.save(game);

        // 9. Persist player state changes (order and current status)
        for (const player of players) {
            await this.playersMutation.save(player);
        }

        // 10. Distribute initial tiles to all players
        const tileDistributionService = new TileDistributionService(this.ctx);
        await tileDistributionService.distributeInitialTiles(game, players);
    }
}
