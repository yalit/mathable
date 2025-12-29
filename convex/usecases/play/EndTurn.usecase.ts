import type {GamesQueryRepositoryInterface} from "../../repository/query/games.repository";
import type {AppMutationCtx} from "../../infrastructure/middleware/app.middleware.ts";
import type {Game} from "../../domain/models/Game.ts";
import type {User} from "../../domain/models/User.ts";
import type {Player} from "../../domain/models/Player.ts";
import { EndGameService } from "../../domain/services/Game/EndGame.service.ts";
import {ScoreService} from "../../domain/services/Play/Score.service.ts";
import {PlayTurnService} from "../../domain/services/Play/Turn.service.ts";
import {TileDistributionService} from "../../domain/services/Tile/TileDistribution.service.ts";
import type { GamesMutationRepositoryInterface } from "../../repository/mutations/games.repository.ts";

/**
 * EndTurnUseCase
 * Orchestrates ending a player's turn and transitioning to the next player
 * Throws errors for validation failures
 */
export class EndTurnUseCase {
    private ctx: AppMutationCtx;
    private readonly gamesQuery:  GamesQueryRepositoryInterface;
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
    ): Promise<{gameEnded: boolean}> {
        // 1. Validate user authorization
        if (!currentPlayer.isSameUser(user)) {
            throw new Error("Only the current player can end their turn");
        }

        // 2. Check if game is won
        if (await this.gamesQuery.isGameWon(game, currentPlayer)) {
            await this.endGameService.endGameWithWinner(game, currentPlayer)
            return {gameEnded: true};
        }

        // 3. Check if game is idle
        if (await this.gamesQuery.isGameIdle(game)) {
            await this.endGameService.endGameAsIdle(game)
            return {gameEnded: true};
        }

        // 4. Get current turn score
        const scoreService = new ScoreService(this.ctx)
        const turnScore = await scoreService.getCurrentTurnScore(game)

        // 5. Update current player's score
        await scoreService.updateCurrentPlayerScore(currentPlayer, turnScore);

        // 6. Switch to next player
        await new PlayTurnService(this.ctx).switchToNextPlayer(game);

        // 7. Distribute tiles to current player (refill to 7)
        await new TileDistributionService(this.ctx).refillPlayerHand(game, currentPlayer);

        // 8. Increment turn counter
        game.incrementTurn();
        await this.gamesMutation.save(game);

        return {gameEnded: false};
    }

}
