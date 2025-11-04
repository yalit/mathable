import {withRepositoryInternalMutation} from "../../middleware/repository.middleware.ts";
import {v} from "convex/values";
import {GamesMutationRepository} from "../../repository/mutations/games.repository.ts";

export const endGameWithWinner = withRepositoryInternalMutation({
    args: { gameId: v.id("games"), playerId: v.id("players") },
    handler: async (_, args) => {
        return GamesMutationRepository.instance.patch(args.gameId, {
            status: "ended",
            winner: args.playerId
        })
    },
});

export const endGameAsIdle = withRepositoryInternalMutation({
    args: { gameId: v.id("games") },
    handler: async (_, args) => {
        return GamesMutationRepository.instance.patch(args.gameId, {
            status: "ended",
        })
    },
});
