import type { ScoreService } from "../../domain/services/Play/Score.service";
import { appQuery } from "../../infrastructure/middleware/app.middleware.ts";
import type { GamesQueryRepositoryInterface } from "../../repository/query/games.repository";
import { v } from "convex/values";

export const getCurrentTurnScore = appQuery({
  args: { gameId: v.id("games") },
  handler: async (ctx, args): Promise<number> => {
    const scoreService: ScoreService = ctx.container.get("ScoreService");
    const gamesQuery: GamesQueryRepositoryInterface = ctx.container.get(
      "GamesQueryRepositoryInterface",
    );

    const game = await gamesQuery.find(args.gameId);

    if (!game) {
      return 0;
    }

    return await scoreService.getCurrentTurnScore(game);
  },
});

