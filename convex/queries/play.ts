import {appQuery, SessionArgs} from "../middleware/app.middleware.ts";
import { v } from "convex/values";
import type { GameQueryRepositoryInterface } from "../repository/query/games.repository.ts";
import type { MovesQueryRepositoryInterface } from "../repository/query/moves.repository.ts";

export const getCurrentTurnScore = appQuery({
    visibility: "public", security: "secure",
    args: {...SessionArgs, gameId: v.id("games") },
    handler: async (ctx, { gameId }): Promise<number> => {
        const gamesQueryRepository: GameQueryRepositoryInterface = ctx.container.get("GameQueryRepositoryInterface")
        const movesQueryRepository: MovesQueryRepositoryInterface = ctx.container.get("MovesQueryRepositoryInterface")

        const game = await gamesQueryRepository.find(gameId)
        if (!game) {
            return 0;
        }

        const moves = await movesQueryRepository.findAllForCurrentTurn(game)
        return moves.reduce((score, m) => score + m.moveScore, 0);
    },
});
