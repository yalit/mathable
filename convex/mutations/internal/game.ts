import {v} from "convex/values";
import {GamesMutationRepository} from "../../repository/mutations/games.repository.ts";
import {GamesQueryRepository} from "../../repository/query/games.repository.ts";
import {createGameFromDoc} from "../../domain/models/factory/game.factory.ts";
import {appMutation} from "../../middleware/app.middleware.ts";

export const endGameWithWinner = appMutation({
    visibility: "internal", security: "internal",
    args: {gameId: v.id("games"), playerId: v.id("players")},
    handler: async (_, args) => {
        const gameDoc = await GamesQueryRepository.instance.find(args.gameId);
        if (!gameDoc) return;

        const game = createGameFromDoc(gameDoc);
        game.endWithWinner(args.playerId);
        return await GamesMutationRepository.instance.save(game);
    },
});

export const endGameAsIdle = appMutation({
    visibility: "internal", security: "internal",
    args: {gameId: v.id("games")},
    handler: async (_, args) => {
        const gameDoc = await GamesQueryRepository.instance.find(args.gameId);
        if (!gameDoc) return;

        const game = createGameFromDoc(gameDoc);
        game.endAsIdle();
        return await GamesMutationRepository.instance.save(game);
    },
});
