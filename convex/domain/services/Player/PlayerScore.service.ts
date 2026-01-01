import type { TilesQueryRepositoryInterface } from "../../../repository/query/tiles.repository";
import type { Player } from "../../models/Player";
import type { PlayersMutationRepositoryInterface } from "../../../repository/mutations/players.repository";

export interface PlayerScoreInterface {
  updateCurrentPlayerScore: (player: Player, score: number) => Promise<void>;
}

export class PlayerScoreService implements PlayerScoreInterface {
  private static instance: PlayerScoreInterface;
  private readonly tilesQuery: TilesQueryRepositoryInterface;
  private readonly playerMutation: PlayersMutationRepositoryInterface;

  constructor(
    tilesQuery: TilesQueryRepositoryInterface,
    playerMutation: PlayersMutationRepositoryInterface,
  ) {
    this.tilesQuery = tilesQuery;
    this.playerMutation = playerMutation;
  }

  static create(
    tilesQuery: TilesQueryRepositoryInterface,
    playerMutation: PlayersMutationRepositoryInterface,
  ) {
    if (!PlayerScoreService.instance) {
      PlayerScoreService.instance = new PlayerScoreService(
        tilesQuery,
        playerMutation,
      );
    }

    return PlayerScoreService.instance;
  }

  async updateCurrentPlayerScore(player: Player, score: number): Promise<void> {
    const playerTiles = await this.tilesQuery.findByPlayer(player);
    const emptyHandBonus = playerTiles.length === 0 ? 50 : 0;

    // Don't remove current flag here - let switchToNextPlayer handle it
    player.addScore(score + emptyHandBonus);
    await this.playerMutation.save(player);
  }
}
