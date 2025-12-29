import type {GameQueryRepositoryInterface} from "../../repository/query/games.repository";
import type {AppMutationCtx} from "../../middleware/app.middleware.ts";
import type {Game} from "../../domain/models/Game.ts";
import type {User} from "../../domain/models/User.ts";
import type {Player} from "../../domain/models/Player.ts";
import { EndGameService } from "../../domain/services/Game/EndGame.service.ts";
import {ScoreService} from "../../domain/services/Play/Score.service.ts";
import {PlayTurnService} from "../../domain/services/Play/Turn.service.ts";
import {TileDistributionService} from "../../domain/services/Tile/TileDistribution.service.ts";
import type { GamesMutationRepositoryInterface } from "../../repository/mutations/games.repository.ts";

export interface EndTurnResult {
    success: boolean;
    error?: string;
    gameEnded?: boolean;
}

/**
 * EndTurnUseCase
 * Orchestrates ending a player's turn and transitioning to the next player
 *
 * Uses dependency injection for all repository access via ServiceContainer
 */
export class EndTurnUseCase {
    private ctx: AppMutationCtx;
    private readonly gamesQuery:  GameQueryRepositoryInterface;
    private readonly gamesMutation: GamesMutationRepositoryInterface
    private readonly endGameService: EndGameService;

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
        this.gamesQuery = this.ctx.container.get("GameQueryRepositoryInterface")
        this.gamesMutation = this.ctx.container.get("GameMutationRepositoryInterface")
        this.endGameService = new EndGameService(this.ctx);
    }

    async execute(
        game: Game,
        user: User,
        currentPlayer: Player,
    ): Promise<EndTurnResult> {
        // 4. Validate user authorization
        if (!currentPlayer.isSameUser(user)) {
            return {
                success: false,
                error: "Only the current player can end their turn",
            };
        }

        // 5. Check if game is won
        if (await this.gamesQuery.isGameWon(game, currentPlayer)) {
            await this.endGameService.endGameWithWinner(game, currentPlayer)
            return {
                success: true,
                gameEnded: true,
            };
        }

        // 6. Check if game is idle
        if (await this.gamesQuery.isGameIdle(game)) {
            await this.endGameService.endGameAsIdle(game)
            return {
                success: true,
                gameEnded: true,
            };
        }

        // 7. Get current turn score
        const scoreService = new ScoreService(this.ctx)
        const turnScore = await scoreService.getCurrentTurnScore(game)

        // 8. Update current player's score
        await scoreService.updateCurrentPlayerScore(currentPlayer, turnScore);

        // 9. Switch to next player
        await new PlayTurnService(this.ctx).switchToNextPlayer(game);

        // 10. Distribute tiles to current player (refill to 7)
        await new TileDistributionService(this.ctx).refillPlayerHand(game, currentPlayer);

        // 11. Increment turn counter
        game.incrementTurn();
        await this.gamesMutation.save(game);

        return {
            success: true,
            gameEnded: false,
        };
    }

}
