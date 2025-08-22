import { v } from "convex/values";
import type { Game } from "../../src/context/model/game.ts";
import type { Doc } from "../_generated/dataModel";
import { gameSchema } from "../../src/context/model/game.ts";
import { cellSchema } from "../../src/context/model/cell.ts";
import { api } from "../_generated/api.js";
import { withSessionQuery } from "../middleware/sessions.ts";
import { vSessionId } from "convex-helpers/server/sessions";
import { withRepositoryQuery } from "../middleware/repository.middleware.ts";
import { PlayersQueryRepository } from "../repository/query/players.repository.ts";
import { CellsQueryRepository } from "../repository/query/cells.repository.ts";
import { GamesQueryRepository } from "../repository/query/games.repository.ts";
import { TilesQueryRepository } from "../repository/query/tiles.repository.ts";

export const get = withRepositoryQuery({
  args: { gameToken: v.string() },
  handler: async (ctx, args): Promise<Game | null> => {
    const game: Doc<"games"> | null =
      await GamesQueryRepository.instance.findByToken(args.gameToken);

    if (!game) {
      return null;
    }

    const gameCells = await CellsQueryRepository.instance.findAllForGame(
      game._id,
    );
    const cells = await Promise.all(
      gameCells.map(async (c) => {
        if (!c.tileId) {
          return c;
        }
        const tile = await TilesQueryRepository.instance.find(c.tileId);
        return cellSchema.parse({ ...c, tile });
      }),
    );

    const gamePlayers = await PlayersQueryRepository.instance.findByGame(
      game._id,
    );
    const players = await Promise.all(
      gamePlayers.map(async (p) => {
        return await ctx.runQuery(api.queries.player.get, {
          playerToken: p.token,
        });
      }),
    );

    const tiles = await TilesQueryRepository.instance.findAllByGame(game._id);

    return gameSchema.parse({
      ...game,
      cells,
      players,
      tiles,
    });
  },
});

export const getNonFinishedForSession = withSessionQuery({
  args: { sessionId: vSessionId },
  handler: async (ctx, _): Promise<Game[]> => {
    const convexGames =
      await GamesQueryRepository.instance.findNonFinishedGamesForSessionId(
        ctx.sessionId,
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
