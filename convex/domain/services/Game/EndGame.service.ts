import type { Player } from "../../models/Player.ts";
import type { Game } from "../../models/Game.ts";
import type { GamesMutationRepositoryInterface } from "../../../repository/mutations/games.repository.ts";
import type { TilesQueryRepositoryInterface } from "../../../repository/query/tiles.repository.ts";
import type { PlayersQueryRepositoryInterface } from "../../../repository/query/players.repository.ts";
import type { MovesQueryRepositoryInterface } from "../../../repository/query/moves.repository.ts";

export interface EndGameServiceInterface {
  isGameWon: (game: Game, player: Player) => Promise<boolean>;
  isGameIdle: (game: Game) => Promise<boolean>;
  endGameWithWinner: (game: Game, player: Player) => Promise<void>;
  endGameAsIdle: (game: Game) => Promise<void>;
}

export class EndGameService implements EndGameServiceInterface {
  private static instance: EndGameServiceInterface;
  private readonly gamesMutation: GamesMutationRepositoryInterface;
  private readonly tilesQuery: TilesQueryRepositoryInterface;
  private readonly playersQuery: PlayersQueryRepositoryInterface;
  private readonly movesQuery: MovesQueryRepositoryInterface;

  constructor(
    gamesMutation: GamesMutationRepositoryInterface,
    tilesQuery: TilesQueryRepositoryInterface,
    playersQuery: PlayersQueryRepositoryInterface,
    movesQuery: MovesQueryRepositoryInterface,
  ) {
    this.gamesMutation = gamesMutation;
    this.tilesQuery = tilesQuery;
    this.playersQuery = playersQuery;
    this.movesQuery = movesQuery;
  }

  static create(
    gamesMutation: GamesMutationRepositoryInterface,
    tilesQuery: TilesQueryRepositoryInterface,
    playersQuery: PlayersQueryRepositoryInterface,
    movesQuery: MovesQueryRepositoryInterface,
  ): EndGameServiceInterface {
    if (!EndGameService.instance) {
      EndGameService.instance = new EndGameService(
        gamesMutation,
        tilesQuery,
        playersQuery,
        movesQuery,
      );
    }
    return EndGameService.instance;
  }

  async isGameWon(game: Game, player: Player): Promise<boolean> {
    const bagTiles = await this.tilesQuery.findAllInBagByGame(game);
    if (bagTiles.length > 0) {
      return false;
    }

    const playerTiles = await this.tilesQuery.findByPlayer(player);

    return playerTiles.length === 0;
  }

  /**
   * Check if the game is idle (no tile placements for 2 full rounds).
   * Only PLAYER_TO_CELL moves count - resets and tile draws don't prevent idle.
   */
  async isGameIdle(game: Game): Promise<boolean> {
    const gamePlayers = await this.playersQuery.findByGame(game);
    const idleThreshold = 2 * gamePlayers.length; // 2 rounds = 2 * number of players

    // Find the last actual tile placement (PLAYER_TO_CELL move)
    const lastPlayerToCellMove =
      await this.movesQuery.findLastPlayerToCellMove(game);

    if (!lastPlayerToCellMove) {
      // No tile has ever been placed
      // Game is idle if enough turns have passed (2 full rounds from start)
      return game.currentTurn > idleThreshold;
    }

    // Game is idle if last tile placement was more than 2 rounds ago
    return lastPlayerToCellMove.turn < game.currentTurn - idleThreshold;
  }

  async endGameWithWinner(game: Game, player: Player): Promise<void> {
    game.endWithWinner(player.id);
    await this.gamesMutation.save(game);
  }

  /**
   * End the game as idle and determine winner by highest score.
   * In case of a tie, the player with the lower order number wins.
   * No score adjustments are made (no tile bonuses/penalties).
   */
  async endGameAsIdle(game: Game): Promise<void> {
    // Get all players in the game
    const allPlayers = await this.playersQuery.findByGame(game);

    if (allPlayers.length === 0) {
      // No players, just end the game without a winner
      game.endAsIdle();
      await this.gamesMutation.save(game);
      return;
    }

    // Sort players by score (desc), then by order (asc) for tie-breaking
    // This ensures the player with highest score and lowest order wins
    const sortedPlayers = [...allPlayers].sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      return a.order - b.order; // Lower order wins ties
    });

    const winner = sortedPlayers[0];

    // End game with the winner (no score adjustments for idle games)
    game.endWithWinner(winner.id);
    await this.gamesMutation.save(game);
  }
}
