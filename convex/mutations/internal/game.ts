import {v} from "convex/values";
import type {GamesMutationRepositoryInterface} from "../../repository/mutations/games.repository.ts";
import type {GameQueryRepositoryInterface} from "../../repository/query/games.repository.ts";
import {createGameFromDoc} from "../../domain/models/factory/game.factory.ts";
import {appMutation} from "../../middleware/app.middleware.ts";

export const endGameWithWinner = appMutation({
    visibility: "internal", security: "internal",
    args: {gameId: v.id("games"), playerId: v.id("players")},
    handler: async (ctx, args) => {
        const gamesQueryRepository: GameQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface");
        const gamesMutationRepository: GamesMutationRepositoryInterface = ctx.container.get("GamesMutationRepositoryInterface");

        const gameDoc = await gamesQueryRepository.find(args.gameId);
        if (!gameDoc) return;

        const game = createGameFromDoc(gameDoc);
        game.endWithWinner(args.playerId);
        return await gamesMutationRepository.save(game);
    },
});

export const endGameAsIdle = appMutation({
    visibility: "internal", security: "internal",
    args: {gameId: v.id("games")},
    handler: async (ctx, args) => {
        const gamesQueryRepository: GameQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface");
        const gamesMutationRepository: GamesMutationRepositoryInterface = ctx.container.get("GamesMutationRepositoryInterface");

        const gameDoc = await gamesQueryRepository.find(args.gameId);
        if (!gameDoc) return;

        const game = createGameFromDoc(gameDoc);
        game.endAsIdle();
        return await gamesMutationRepository.save(game);
    },
});
