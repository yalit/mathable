import {internal} from "../../_generated/api";
import type {MutationCtx} from "../../_generated/server";
import {TilesQueryRepository} from "../../repository/query/tiles.repository";
import type {Game} from "../models/Game.ts";
import type {Player} from "../models/Player.ts";
import type {Tile} from "../models/Tile.ts";

/**
 * TileDistributionService
 * Domain service responsible for tile distribution logic
 */
export class TileDistributionService {
    private readonly INITIAL_TILE_COUNT = 7;
    private ctx: MutationCtx;

    constructor(ctx: MutationCtx) {
        this.ctx = ctx;
    }

    /**
     * Distribute initial tiles to all players at game start
     */
    async distributeInitialTiles(
        game: Game,
        players: Player[]
    ): Promise<void> {
        for (const player of players) {
            await this.dealTilesToPlayer(game, player);
        }
    }

    /**
     * Deal a specific number of tiles to a player
     */
    async dealTilesToPlayer(
        game: Game,
        player: Player,
        count: number = this.INITIAL_TILE_COUNT
    ): Promise<void> {
        const playerId = player.id;
        if (!playerId) return

        const availableTiles = await TilesQueryRepository.instance
            .findAllInBagByGame(game);

        if (availableTiles.length === 0) {
            return; // No tiles left to deal
        }

        const tilesToDeal = this.selectRandomTiles(availableTiles, count);

        for (const tile of tilesToDeal) {
            const tileId = tile.id;
            if (!tileId) continue;

            await this.ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
                tileId,
                playerId,
            });
        }
    }

    /**
     * Refill a player's hand up to the initial tile count
     */
    async refillPlayerHand(game: Game, player: Player): Promise<void> {
        const currentTiles = await TilesQueryRepository.instance.findByPlayer(player);
        const needed = this.INITIAL_TILE_COUNT - currentTiles.length;

        if (needed > 0) {
            await this.dealTilesToPlayer(game, player, needed);
        }
    }

    /**
     * Select random tiles from available tiles
     * Private helper method
     */
    private selectRandomTiles(
        tiles: Tile[],
        count: number
    ): Tile[] {
        return tiles
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(count, tiles.length));
    }
}
