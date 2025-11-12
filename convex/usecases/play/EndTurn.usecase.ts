import { api, internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { SessionId } from "convex-helpers/server/sessions";
import { playerFromDoc } from "../../domain/models/factory/player.factory";
import { createGameFromDoc } from "../../domain/models/factory/game.factory";
import type { ServiceContainer } from "../../infrastructure/ServiceContainer";
import { SERVICE_IDENTIFIERS } from "../../infrastructure/ServiceRegistry";

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
  private ctx: MutationCtx;
  private container: ServiceContainer;

  constructor(ctx: MutationCtx, container: ServiceContainer) {
    this.ctx = ctx;
    this.container = container;
  }

  async execute(
    gameId: Id<"games">,
    userId: Id<"users">,
    sessionId: SessionId
  ): Promise<EndTurnResult> {
    // Get repositories from container
    const gamesQuery = this.container.get(SERVICE_IDENTIFIERS.GamesQuery);
    const playersQuery = this.container.get(SERVICE_IDENTIFIERS.PlayersQuery);
    const gamesMutation = this.container.get(SERVICE_IDENTIFIERS.GamesMutation);

    // 1. Load game
    const gameDoc = await gamesQuery.find(gameId);
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
    const currentPlayerDoc = await playersQuery.findCurrentPlayer(game.id);
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
    if (await gamesQuery.isGameWon(gameId, currentPlayerDoc._id)) {
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
    if (await gamesQuery.isGameIdle(gameDoc._id)) {
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
    await gamesMutation.save(game);

    return {
      success: true,
      gameEnded: false,
    };
  }

  /**
   * Update current player's score with turn score and bonus
   * Note: Does NOT remove current flag - that's handled in switchToNextPlayer
   */
  private async updateCurrentPlayerScore(
    playerId: Id<"players">,
    turnScore: number
  ): Promise<void> {
    const playersQuery = this.container.get(SERVICE_IDENTIFIERS.PlayersQuery);
    const tilesQuery = this.container.get(SERVICE_IDENTIFIERS.TilesQuery);
    const playersMutation = this.container.get(SERVICE_IDENTIFIERS.PlayersMutation);

    const playerDoc = await playersQuery.find(playerId);
    if (!playerDoc) {
      return;
    }

    // Check if player has empty hand (bonus points)
    const playerTiles = await tilesQuery.findByPlayer(playerId);
    const emptyHandBonus = playerTiles.length === 0 ? 50 : 0;

    const player = playerFromDoc(playerDoc);
    // Don't remove current flag here - let switchToNextPlayer handle it
    player.addScore(turnScore + emptyHandBonus);
    await playersMutation.save(player);
  }

  /**
   * Switch turn to next player
   * Removes current flag from old player and sets it on new player
   */
  private async switchToNextPlayer(gameId: Id<"games">): Promise<void> {
    const playersQuery = this.container.get(SERVICE_IDENTIFIERS.PlayersQuery);
    const playersMutation = this.container.get(SERVICE_IDENTIFIERS.PlayersMutation);

    // 1. Find current player first
    const currentPlayerDoc = await playersQuery.findCurrentPlayer(gameId);
    if (!currentPlayerDoc) {
      throw new Error("No current player found when trying to switch turns");
    }

    // 2. Find next player
    const nextPlayerDoc = await playersQuery.findNextPlayer(gameId);
    if (!nextPlayerDoc) {
      // Provide more context for debugging
      const allPlayers = await playersQuery.findByGame(gameId);

      const debugInfo = `No next player found. Game has ${allPlayers.length} players. ` +
        `Current player order: ${currentPlayerDoc.order}. ` +
        `Player orders: [${allPlayers.map(p => p.order).join(', ')}]`;

      throw new Error(debugInfo);
    }

    // 3. Remove current flag from old player
    const currentPlayer = playerFromDoc(currentPlayerDoc);
    currentPlayer.removeAsCurrent();
    await playersMutation.save(currentPlayer);

    // 4. Set current flag on next player
    const nextPlayer = playerFromDoc(nextPlayerDoc);
    nextPlayer.setAsCurrent();
    await playersMutation.save(nextPlayer);
  }

  /**
   * Distribute tiles to player to refill hand to 7 tiles
   */
  private async distributeTilesToPlayer(
    gameId: Id<"games">,
    playerId: Id<"players">
  ): Promise<void> {
    const tilesQuery = this.container.get(SERVICE_IDENTIFIERS.TilesQuery);

    const currentTiles = await tilesQuery.findByPlayer(playerId);
    const neededTiles = 7 - currentTiles.length;

    for (let i = 0; i < neededTiles; i++) {
      const tilesInBag = await tilesQuery.findAllInBagByGame(gameId);

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
