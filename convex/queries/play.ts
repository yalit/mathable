import { getGame, getGameCurrentTurnMoves } from "../helpers/game";
import { queryWithSession } from "../middleware/sessions";
import { v } from "convex/values";

export const getCurrentTurnScore = queryWithSession({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }): Promise<number> => {
    const game = await getGame(gameId, ctx);
    if (!game) {
      return 0;
    }

    const moves = await getGameCurrentTurnMoves(game, ctx);
    return moves.reduce((score, m) => score + m.moveScore, 0);
  },
});
