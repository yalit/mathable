import type { Player } from "../../models/Player.ts";
import type { Game } from "../../models/Game.ts";
import type { PlayersQueryRepositoryInterface } from "../../../repository/query/players.repository.ts";
import type { PlayersMutationRepositoryInterface } from "../../../repository/mutations/players.repository.ts";
import type { TilesQueryRepositoryInterface } from "../../../repository/query/tiles.repository.ts";

export interface FinalScoreServiceInterface {
  calculateAndApplyFinalScores: (game: Game, winner: Player) => Promise<void>;
}

export class FinalScoreService implements FinalScoreServiceInterface {
  private static instance: FinalScoreServiceInterface;
  private readonly playersQuery: PlayersQueryRepositoryInterface;
  private readonly playersMutation: PlayersMutationRepositoryInterface;
  private readonly tilesQuery: TilesQueryRepositoryInterface;

  constructor(
    playersQuery: PlayersQueryRepositoryInterface,
    playersMutation: PlayersMutationRepositoryInterface,
    tilesQuery: TilesQueryRepositoryInterface,
  ) {
    this.playersQuery = playersQuery;
    this.playersMutation = playersMutation;
    this.tilesQuery = tilesQuery;
  }

  static create(
    playersQuery: PlayersQueryRepositoryInterface,
    playersMutation: PlayersMutationRepositoryInterface,
    tilesQuery: TilesQueryRepositoryInterface,
  ): FinalScoreServiceInterface {
    if (!FinalScoreService.instance) {
      FinalScoreService.instance = new FinalScoreService(
        playersQuery,
        playersMutation,
        tilesQuery,
      );
    }
    return FinalScoreService.instance;
  }

  /**
   * Calculate and apply final scores for a regular win:
   * - Winner gets bonus points equal to sum of all opponent tile values
   * - Each opponent loses points equal to their own tile values
   */
  async calculateAndApplyFinalScores(
    game: Game,
    winner: Player,
  ): Promise<void> {
    // Get all players in the game
    const allPlayers = await this.playersQuery.findByGame(game);

    // Get opponents (all players except winner)
    const opponents = allPlayers.filter((p) => p.id !== winner.id);

    if (opponents.length === 0) {
      // No opponents, no score adjustments needed
      return;
    }

    // Calculate tile values for each opponent (only tiles in hand)
    let totalOpponentTileValue = 0;
    const opponentTileValues: Map<string, number> = new Map();

    for (const opponent of opponents) {
      const tiles = await this.tilesQuery.findByPlayer(opponent);
      // Only count tiles in hand, not on board
      const tilesInHand = tiles.filter((tile) => tile.isInHand());
      const tileSum = tilesInHand.reduce((sum, tile) => sum + tile.value, 0);
      opponentTileValues.set(opponent.id, tileSum);
      totalOpponentTileValue += tileSum;
    }

    // Update winner's score: add all opponent tile values
    winner.addScore(totalOpponentTileValue);
    await this.playersMutation.save(winner);

    // Update each opponent's score: subtract their own tile values
    for (const opponent of opponents) {
      const tileValue = opponentTileValues.get(opponent.id) || 0;
      opponent.subtractScore(tileValue);
      await this.playersMutation.save(opponent);
    }
  }
}
