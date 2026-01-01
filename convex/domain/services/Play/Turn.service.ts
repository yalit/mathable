import type { PlayersQueryRepositoryInterface } from "../../../repository/query/players.repository";
import type {PlayersMutationRepositoryInterface} from "../../../repository/mutations/players.repository.ts";
import type {Game} from "../../models/Game.ts";

export interface PlayTurnServiceInterface {
    switchToNextPlayer: (game: Game) => Promise<void>;
}

export class PlayTurnService implements PlayTurnServiceInterface {
    private static instance: PlayTurnServiceInterface;
    private readonly playerQuery: PlayersQueryRepositoryInterface;
    private readonly playerMutation: PlayersMutationRepositoryInterface;

    constructor(
        playerQuery: PlayersQueryRepositoryInterface,
        playerMutation: PlayersMutationRepositoryInterface
    ) {
        this.playerQuery = playerQuery;
        this.playerMutation = playerMutation;
    }

    static create(
        playerQuery: PlayersQueryRepositoryInterface,
        playerMutation: PlayersMutationRepositoryInterface
    ): PlayTurnServiceInterface {
        if (!PlayTurnService.instance) {
            PlayTurnService.instance = new PlayTurnService(
                playerQuery,
                playerMutation
            );
        }
        return PlayTurnService.instance;
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