import type {AppMutationCtx} from "../../../infrastructure/middleware/app.middleware.ts";
import type {Player} from "../../models/Player.ts";
import type {Game} from "../../models/Game.ts";
import type {GamesMutationRepositoryInterface} from "../../../repository/mutations/games.repository.ts";

export class EndGameService {
    private readonly ctx: AppMutationCtx
    private gamesMutation: GamesMutationRepositoryInterface

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
        this.gamesMutation = this.ctx.container.get("GameMutationRepositoryInterface");
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