import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Game } from "../../src/context/model/game.ts";
import type { Doc } from "../_generated/dataModel";
import { getGameCells, getGamePlayers } from "../helpers/game.ts";
import { gameSchema } from "../../src/context/model/game.ts";

export const get = query({
  args: { gameToken: v.string() },
  handler: async (ctx, args): Promise<Game | null> => {
    const game: Doc<"games"> | null = await ctx.db
      .query("games")
      .withIndex("by_token", (q) => q.eq("token", args.gameToken))
      .unique();

    if (!game) {
      return null;
    }

    const gameCells = await getGameCells(game, ctx);
    const gamePlayers = await getGamePlayers(game, ctx);

    return gameSchema.parse({
      ...game,
      cells: gameCells,
      players: gamePlayers,
    });
  },
});
