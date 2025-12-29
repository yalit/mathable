import type {AppMutationCtx} from "../../../infrastructure/middleware/app.middleware.ts";
import type {Game} from "../../models/Game.ts";
import type {MovesQueryRepositoryInterface} from "../../../repository/query/moves.repository.ts";
import type {Player} from "../../models/Player.ts";
import type { TilesQueryRepositoryInterface } from "../../../repository/query/tiles.repository.ts";
import type { PlayersMutationRepositoryInterface } from "../../../repository/mutations/players.repository.ts";
import type { Cell } from "../../models/Cell.ts";
import type {Tile} from "../../models/Tile.ts";
import {countItems} from "../../../lib/array.ts";

export class ScoreService {
    private readonly ctx: AppMutationCtx
    private readonly movesQuery: MovesQueryRepositoryInterface
    private readonly tilesQuery: TilesQueryRepositoryInterface
    private readonly playerMutation:  PlayersMutationRepositoryInterface

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
        this.movesQuery = this.ctx.container.get("MovesQueryRepositoryInterface")
        this.tilesQuery = this.ctx.container.get("TilesQueryRepositoryInterface")
        this.playerMutation = this.ctx.container.get("PlayerMutationRepositoryInterface")
    }

    async getCurrentTurnScore(game: Game): Promise<number> {
        const moves = await this.movesQuery.findAllForCurrentTurn(game)
        return moves.reduce((score, m) => score + m.score, 0);
    }

    async updateCurrentPlayerScore(player: Player, score: number): Promise<void> {
        const playerTiles = await this.tilesQuery.findByPlayer(player);
        const emptyHandBonus = playerTiles.length === 0 ? 50 : 0;

        // Don't remove current flag here - let switchToNextPlayer handle it
        player.addScore(score + emptyHandBonus);
        await this.playerMutation.save(player);
    }

    computeMoveScore(cell: Cell, tile: Tile): number {
        const tileValue = tile.value
        const occurrenceCount = countItems(cell.allowedValues as number[], tileValue);
        const baseScore = tileValue * occurrenceCount;

        // Apply multiplier if cell is a MultiplierCell
        if (cell.isMultiplierCell()) {
            return baseScore * cell.multiplier;
        }

        return baseScore;
    }
}