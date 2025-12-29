import type {AppMutationCtx} from "../../../middleware/app.middleware.ts";
import type { Game } from "../../models/Game.ts";
import type {Player} from "../../models/Player.ts";
import type {TilesQueryRepositoryInterface} from "../../../repository/query/tiles.repository.ts";
import type {Tile} from "../../models/Tile.ts";
import { TileMoveService } from "./TileMove.service.ts";

/**
 * TileDistributionService
 * Domain service responsible for tile distribution logic
 */
export class TileDistributionService {
    private readonly INITIAL_TILE_COUNT = 7;
    private ctx: AppMutationCtx;

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
    }

    tilesQuery(): TilesQueryRepositoryInterface {
        return this.ctx.container.get("TileQueryRepositoryInterface")
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

        const availableTiles = await this.tilesQuery().findAllInBagByGame(game);

        if (availableTiles.length === 0) {
            return; // No tiles left to deal
        }

        const tilesToDeal = this.selectRandomTiles(availableTiles, count);

        for (const tile of tilesToDeal) {
            const tileId = tile.id;
            if (!tileId) continue;

            const tileMoveService = new TileMoveService(this.ctx);
            await tileMoveService.moveToPlayer(tile, player)
        }
    }

    /**
     * Refill a player's hand up to the initial tile count
     */
    async refillPlayerHand(game: Game, player: Player): Promise<void> {
        const currentTiles = await this.tilesQuery().findByPlayer(player);
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
