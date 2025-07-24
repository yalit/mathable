import { cellSchema, type Cell } from "../../src/context/model/cell";
import { playerSchema, type Player } from "../../src/context/model/player";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { getPlayerTiles } from "./player";

export const getGameCells = async (
  game: Doc<"games">,
  ctx: QueryCtx,
): Promise<Cell[]> => {
  const gameCells = await ctx.db
    .query("cells")
    .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
    .collect();

  return gameCells.map((c) => cellSchema.parse(c));
};

export const getGamePlayers = async (
  game: Doc<"games">,
  ctx: QueryCtx,
): Promise<Player[]> => {
  const gamePlayers = await ctx.db
    .query("players")
    .withIndex("by_game", (q) => q.eq("gameId", game._id))
    .collect();

  return Promise.all(
    gamePlayers.map(async (p) => {
      const tiles = await getPlayerTiles(p, ctx);
      return playerSchema.parse({ ...p, tiles });
    }),
  );
};
