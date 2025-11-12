import { api, internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { PlayersQueryRepository } from "../../repository/query/players.repository";
import { GamesQueryRepository } from "../../repository/query/games.repository";
import { TilesQueryRepository } from "../../repository/query/tiles.repository";
import { PlayersMutationRepository } from "../../repository/mutations/players.repository";
import { GamesMutationRepository } from "../../repository/mutations/games.repository";
import { playerFromDoc } from "../../domain/models/factory/player.factory";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";

export interface EndTurnResult {
  success: boolean;
  error?: string;
  gameEnded?: boolean;
}

/**
 * EndTurnUseCase
 * Orchestrates ending a player's turn and transitioning to the next player
 */
export class EndTurnUseCase {
  private ctx: MutationCtx;

  constructor(ctx: MutationCtx) {
    this.ctx = ctx;
  }

  async execute(
    gameId: Id<"games">,
    userId: Id<"users">,
    sessionId: string
  ): Promise<EndTurnResult> {
    // 1. Load game
    const gameDoc = await GamesQueryRepository.instance.find(gameId);
    if (!gameDoc) {
      return {
        success: false,
        error: "Game not found",
      };
    }

    const game = createGameFromDoc(gameDoc);

    // 2. Validate game is instantiated
    if (!game.id) {
      return {
        success: false,
        error: "Game not instantiated",
      };
    }

    // 3. Load current player
    const currentPlayerDoc = await PlayersQueryRepository.instance.findCurrentPlayer(game.id);
    if (!currentPlayerDoc) {
      return {
        success: false,
        error: "No current player found",
      };
    }

    const currentPlayer = playerFromDoc(currentPlayerDoc);

    // 4. Validate user authorization
    if (!currentPlayer.isSameUser(userId)) {
      return {
        success: false,
        error: "Only the current player can end their turn",
      };
    }

    // 5. Check if game is won
    if (await GamesQueryRepository.instance.isGameWon(gameId, currentPlayerDoc._id)) {
      await this.ctx.runMutation(internal.mutations.internal.game.endGameWithWinner, {
        gameId: gameId,
        playerId: currentPlayerDoc._id,
      });
      return {
        success: true,
        gameEnded: true,
      };
    }

    // 6. Check if game is idle
    if (await GamesQueryRepository.instance.isGameIdle(gameDoc._id)) {
      await this.ctx.runMutation(internal.mutations.internal.game.endGameAsIdle, {
        gameId: gameId,
      });
      return {
        success: true,
        gameEnded: true,
      };
    }

    // 7. Get current turn score
    const turnScore = await this.ctx.runQuery(api.queries.play.getCurrentTurnScore, {
      gameId,
      sessionId,
    });

    // 8. Update current player's score
    await this.updateCurrentPlayerScore(currentPlayerDoc._id, turnScore);

    // 9. Switch to next player
    await this.switchToNextPlayer(game.id);

    // 10. Distribute tiles to current player (refill to 7)
    await this.distributeTilesToPlayer(game.id, currentPlayerDoc._id);

    // 11. Increment turn counter
    game.incrementTurn();
    await GamesMutationRepository.instance.save(game);

    return {
      success: true,
      gameEnded: false,
    };
  }

  /**
   * Update current player's score with turn score and bonus
   */
  private async updateCurrentPlayerScore(
    playerId: Id<"players">,
    turnScore: number
  ): Promise<void> {
    const playerDoc = await PlayersQueryRepository.instance.find(playerId);
    if (!playerDoc) {
      return;
    }

    // Check if player has empty hand (bonus points)
    const playerTiles = await TilesQueryRepository.instance.findByPlayer(playerId);
    const emptyHandBonus = playerTiles.length === 0 ? 50 : 0;

    const player = playerFromDoc(playerDoc);
    player.removeAsCurrent();
    player.addScore(turnScore + emptyHandBonus);
    await PlayersMutationRepository.instance.save(player);
  }

  /**
   * Switch turn to next player
   */
  private async switchToNextPlayer(gameId: Id<"games">): Promise<void> {
    const nextPlayerDoc = await PlayersQueryRepository.instance.findNextPlayer(gameId);

    if (!nextPlayerDoc) {
      // Provide more context for debugging
      const allPlayers = await PlayersQueryRepository.instance.findByGame(gameId);
      const currentPlayer = await PlayersQueryRepository.instance.findCurrentPlayer(gameId);

      const debugInfo = `No next player found. Game has ${allPlayers.length} players. ` +
        `Current player order: ${currentPlayer?.order || 'none'}. ` +
        `Player orders: [${allPlayers.map(p => p.order).join(', ')}]`;

      throw new Error(debugInfo);
    }

    const nextPlayer = playerFromDoc(nextPlayerDoc);
    nextPlayer.setAsCurrent();
    await PlayersMutationRepository.instance.save(nextPlayer);
  }

  /**
   * Distribute tiles to player to refill hand to 7 tiles
   */
  private async distributeTilesToPlayer(
    gameId: Id<"games">,
    playerId: Id<"players">
  ): Promise<void> {
    const currentTiles = await TilesQueryRepository.instance.findByPlayer(playerId);
    const neededTiles = 7 - currentTiles.length;

    for (let i = 0; i < neededTiles; i++) {
      const tilesInBag = await TilesQueryRepository.instance.findAllInBagByGame(gameId);

      if (tilesInBag.length === 0) {
        break; // No more tiles in bag
      }

      // Pick a random tile from the bag
      const randomIndex = Math.floor(Math.random() * tilesInBag.length);
      const selectedTile = tilesInBag[randomIndex];

      await this.ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
        tileId: selectedTile._id as Id<"tiles">,
        playerId,
      });
    }
  }
}
