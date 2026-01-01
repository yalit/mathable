import type { AppMutationCtx } from "../../infrastructure/middleware/app.middleware.ts";
import type { Game } from "../../domain/models/Game.ts";
import type { User } from "../../domain/models/User.ts";
import type { Player } from "../../domain/models/Player.ts";
import type { EndGameServiceInterface } from "../../domain/services/Game/EndGame.service.ts";
import type { PlayTurnServiceInterface } from "../../domain/services/Play/Turn.service.ts";
import type { TileDistributionServiceInterface } from "../../domain/services/Tile/TileDistribution.service.ts";
import type { GamesMutationRepositoryInterface } from "../../repository/mutations/games.repository.ts";
import type { ScoreServiceInterface } from "@cvx/domain/services/Play/Score.service.ts";
import type { PlayerScoreInterface } from "@cvx/domain/services/Player/PlayerScore.service.ts";

/**
 * EndTurnUseCase
 * Orchestrates ending a player's turn and transitioning to the next player
 * Throws errors for validation failures
 */
export class EndTurnUseCase {
  private readonly ctx: AppMutationCtx;
  private readonly gamesMutation: GamesMutationRepositoryInterface;
  private readonly endGameService: EndGameServiceInterface;

  constructor(ctx: AppMutationCtx) {
    this.ctx = ctx;
    this.gamesMutation = this.ctx.container.get(
      "GamesMutationRepositoryInterface",
    );
    this.endGameService = this.ctx.container.get("EndGameServiceInterface");
  }

  async execute(
    game: Game,
    user: User,
    currentPlayer: Player,
  ): Promise<{ gameEnded: boolean }> {
    // 1. Validate user authorization
    if (!currentPlayer.isSameUser(user)) {
      throw new Error("Only the current player can end their turn");
    }

    // 2. Check if game is won
    if (await this.endGameService.isGameWon(game, currentPlayer)) {
      await this.endGameService.endGameWithWinner(game, currentPlayer);
      return { gameEnded: true };
    }

    // 3. Check if game is idle
    if (await this.endGameService.isGameIdle(game)) {
      await this.endGameService.endGameAsIdle(game);
      return { gameEnded: true };
    }

    // 4. Get current turn score
    const scoreService: ScoreServiceInterface = this.ctx.container.get(
      "ScoreServiceInterface",
    );
    const playerScoreService: PlayerScoreInterface = this.ctx.container.get(
      "PlayerScoreInterface",
    );
    const turnScore = await scoreService.getCurrentTurnScore(game);

    // 5. Update current player's score
    await playerScoreService.updateCurrentPlayerScore(currentPlayer, turnScore);

    // 6. Switch to next player
    const playTurnService: PlayTurnServiceInterface = this.ctx.container.get(
      "PlayTurnServiceInterface",
    );
    await playTurnService.switchToNextPlayer(game);

    // 7. Distribute tiles to current player (refill to 7)
    const tileDistributionService: TileDistributionServiceInterface =
      this.ctx.container.get("TileDistributionServiceInterface");
    await tileDistributionService.refillPlayerHand(game, currentPlayer);

    // 8. Increment turn counter
    game.incrementTurn();
    await this.gamesMutation.save(game);

    return { gameEnded: false };
  }
}
