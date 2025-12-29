import type { AppMutationCtx } from "../../../infrastructure/middleware/app.middleware";
import type { PlayersQueryRepositoryInterface } from "../../../repository/query/players.repository";
import type {PlayersMutationRepositoryInterface} from "../../../repository/mutations/players.repository.ts";
import type {Game} from "../../models/Game.ts";

export class PlayTurnService {
    private readonly ctx: AppMutationCtx
    private readonly playerQuery: PlayersQueryRepositoryInterface
    private readonly playerMutation:  PlayersMutationRepositoryInterface

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
        this.playerQuery = this.ctx.container.get("PlayersQueryRepositoryInterface")
        this.playerMutation = this.ctx.container.get("PlayerMutationRepositoryInterface")
    }

    async switchToNextPlayer(game: Game): Promise<void> {
        // 1. Find current player first
        const currentPlayer = await this.playerQuery.findCurrentPlayer(game);
        if (!currentPlayer) {
            throw new Error("No current player found when trying to switch turns");
        }

        // 2. Find next player
        const nextPlayer = await this.playerQuery.findNextPlayer(game);
        if (!nextPlayer) {
            // Provide more context for debugging
            throw new Error("No next player found when trying to switch turns");
        }

        // 3. Remove current flag from old player
        currentPlayer.removeAsCurrent();
        await this.playerMutation.save(currentPlayer);

        // 4. Set current flag on next player
        nextPlayer.setAsCurrent();
        await this.playerMutation.save(nextPlayer);
    }
}