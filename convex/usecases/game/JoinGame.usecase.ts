import type {PlayersQueryRepositoryInterface} from "../../repository/query/players.repository";
import type {AppMutationCtx} from "../../infrastructure/middleware/app.middleware.ts";
import type {Game} from "../../domain/models/Game.ts";
import type {PlayersMutationRepositoryInterface} from "../../repository/mutations/players.repository.ts";
import type {User} from "../../domain/models/User.ts";

/**
 * JoinGameUseCase
 * Orchestrates a player joining an existing game
 * Throws errors for validation failures
 */
export class JoinGameUseCase {
    private readonly ctx: AppMutationCtx;

    constructor(ctx: AppMutationCtx) {
        this.ctx = ctx;
    }

    private get playersQuery(): PlayersQueryRepositoryInterface {
        return this.ctx.container.get("PlayersQueryRepositoryInterface");
    }

    private get playersMutation(): PlayersMutationRepositoryInterface {
        return this.ctx.container.get("PlayersMutationRepositoryInterface");
    }

    async execute(
        game: Game,
        user: User,
        playerName: string,
    ): Promise<{playerToken: string}> {
        // 1. Validate game is in waiting status
        if (!game.isWaiting()) {
            throw new Error("Game has already started");
        }

        // 2. Validate there's room for more players
        const players = await this.playersQuery.findByGame(game);
        if (players.length >= 4) {
            throw new Error("Game is full (maximum 4 players)");
        }

        // 3. Create player
        const player = await this.playersMutation.newFromName(game, user, playerName);

        return {playerToken: player.token};
    }
}
