import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Game } from "../../src/context/model/game.ts";
import type { Doc } from "../_generated/dataModel";
import {
  getAllGameTiles,
  getGameBagTiles,
  getGameCells,
  getGamePlayers,
  getNonFinishedGamesForSessionId,
} from "../helpers/game.ts";
import { gameSchema } from "../../src/context/model/game.ts";
import { cellSchema } from "../../src/context/model/cell.ts";
import { api } from "../_generated/api.js";
import { queryWithSession } from "../middleware/sessions.ts";
import { vSessionId } from "convex-helpers/server/sessions";

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
    const cells = await Promise.all(
      gameCells.map(async (c) => {
        if (!c.tileId) {
          return c;
        }
        const tile = await ctx.db.get(c.tileId);
        return cellSchema.parse({ ...c, tile });
      }),
    );

    const gamePlayers = await getGamePlayers(game, ctx);
    const players = await Promise.all(
      gamePlayers.map(async (p) => {
        return await ctx.runQuery(api.queries.player.get, {
          playerToken: p.token,
        });
      }),
    );

    const tiles = await getAllGameTiles(game, ctx);

    return gameSchema.parse({
      ...game,
      cells,
      players,
      tiles,
    });
  },
});

export const getNonFinishedForSession = queryWithSession({
  args: { sessionId: vSessionId },
  handler: async (ctx, _): Promise<Game[]> => {
    const convexGames = await getNonFinishedGamesForSessionId(
      ctx.sessionId,
      ctx,
    );

    const games: Game[] = [];
    await Promise.all(
      convexGames.map(async (g) => {
        const game = await ctx.runQuery(api.queries.game.get, {
          gameToken: g.token,
        });
        if (game !== null) {
          games.push(game);
        }
      }),
    );

    return games;
  },
});
