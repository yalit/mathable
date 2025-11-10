import { internal } from "../../_generated/api";
import type { MutationCtx } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";
import { TilesQueryRepository } from "../../repository/query/tiles.repository";

/**
 * TileDistributionService
 * Domain service responsible for tile distribution logic
 */
export class TileDistributionService {
  private readonly INITIAL_TILE_COUNT = 7;

  constructor(private ctx: MutationCtx) {}

  /**
   * Distribute initial tiles to all players at game start
   */
  async distributeInitialTiles(
    gameId: Id<"games">,
    players: Doc<"players">[]
  ): Promise<void> {
    for (const player of players) {
      await this.dealTilesToPlayer(gameId, player._id as Id<"players">);
    }
  }

  /**
   * Deal a specific number of tiles to a player
   */
  async dealTilesToPlayer(
    gameId: Id<"games">,
    playerId: Id<"players">,
    count: number = this.INITIAL_TILE_COUNT
  ): Promise<void> {
    const availableTiles = await TilesQueryRepository.instance
      .findAllInBagByGame(gameId);

    if (availableTiles.length === 0) {
      return; // No tiles left to deal
    }

    const tilesToDeal = this.selectRandomTiles(availableTiles, count);

    for (const tile of tilesToDeal) {
      await this.ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
        tileId: tile._id as Id<"tiles">,
        playerId,
      });
    }
  }

  /**
   * Refill a player's hand up to the initial tile count
   */
  async refillPlayerHand(
    gameId: Id<"games">,
    playerId: Id<"players">
  ): Promise<void> {
    const currentTiles = await TilesQueryRepository.instance.findByPlayer(playerId);
    const needed = this.INITIAL_TILE_COUNT - currentTiles.length;

    if (needed > 0) {
      await this.dealTilesToPlayer(gameId, playerId, needed);
    }
  }

  /**
   * Select random tiles from available tiles
   * Private helper method
   */
  private selectRandomTiles(
    tiles: Doc<"tiles">[],
    count: number
  ): Doc<"tiles">[] {
    return tiles
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, tiles.length));
  }
}
