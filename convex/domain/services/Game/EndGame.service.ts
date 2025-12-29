import type {AppMutationCtx} from "../../../infrastructure/middleware/app.middleware.ts";
import type {Player} from "../../models/Player.ts";
import type {Game} from "../../models/Game.ts";
import type {GamesMutationRepositoryInterface} from "../../../repository/mutations/games.repository.ts";
import type {TilesQueryRepositoryInterface} from "../../../repository/query/tiles.repository.ts";
import {
    type PlayersQueryRepositoryInterface
} from "../../../repository/query/players.repository.ts";
import type {MovesQueryRepositoryInterface} from "../../../repository/query/moves.repository.ts";

export class EndGameService {
    private readonly ctx: AppMutationCtx
    private readonly gamesMutation: GamesMutationRepositoryInterface
    private readonly tilesQuery: TilesQueryRepositoryInterface
    private readonly playersQuery: PlayersQueryRepositoryInterface
    private readonly movesQuery: MovesQueryRepositoryInterface

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
        this.gamesMutation = this.ctx.container.get("GameMutationRepositoryInterface");
        this.tilesQuery = this.ctx.container.get("TilesQueryRepositoryInterface");
        this.playersQuery = this.ctx.container.get("PlayersQueryRepositoryInterface");
        this.movesQuery = this.ctx.container.get("MovesQueryRepositoryInterface");
    }

    async isGameWon(game: Game, player: Player): Promise<boolean> {
        const bagTiles = await this.tilesQuery.findAllInBagByGame(game);
        if (bagTiles.length > 0) {
            return false
        }

        const playerTiles = await this.tilesQuery.findByPlayer(player)

        return playerTiles.length === 0;
    }

    async isGameIdle(game: Game): Promise<boolean> {
        const lastMove = await this.movesQuery.findLast(game);

        if (!lastMove) {
            return false;
        }

        const gamePlayers = await this.playersQuery.findByGame(game)

        return lastMove.turn < game.currentTurn - (2 * gamePlayers.length); // 2 turn by players not doing any moves
    }

    async endGameWithWinner(game: Game, player: Player):  Promise<void> {
        game.endWithWinner(player.id);
        await this.gamesMutation.save(game);
    }

    async endGameAsIdle(game: Game):  Promise<void> {
        game.endAsIdle();
        await this.gamesMutation.save(game);
    }
}