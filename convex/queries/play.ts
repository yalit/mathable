import { withSessionQuery } from "../middleware/sessions";
import { v } from "convex/values";
import { GamesQueryRepository } from "../repository/query/games.repository.ts";
import { MovesQueryRepository } from "../repository/query/moves.repository.ts";

export const getCurrentTurnScore = withSessionQuery({
    args: { gameId: v.id("games") },
    handler: async (_, { gameId }): Promise<number> => {
        const game = await GamesQueryRepository.instance.find(gameId)
        if (!game) {
            return 0;
        }

        const moves = await MovesQueryRepository.instance.findAllForCurrentTurn(game)
        return moves.reduce((score, m) => score + m.moveScore, 0);
    },
});
