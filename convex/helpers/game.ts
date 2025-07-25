import { tileSchema, type Tile } from "../../src/context/model/tile";
import { cellSchema, type Cell } from "../../src/context/model/cell";
import { playerSchema, type Player } from "../../src/context/model/player";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { getPlayerTiles } from "./player";

export const getGame = async (
  gameId: Id<"games">,
  ctx: QueryCtx,
): Promise<Doc<"games"> | null> => {
  return await ctx.db.get(gameId);
};

export const getGameCells = async (
  game: Doc<"games">,
  ctx: QueryCtx,
): Promise<Cell[]> => {
  const gameCells = await ctx.db
    .query("cells")
    .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
    .collect();

  return Promise.all(
    gameCells.map(async (c) => {
      let cell = c;
      if (c.tileId) {
        const tile = await ctx.db.get(c.tileId);
        if (tile) {
          cell = { ...c, tile };
        }
      }

      return cellSchema.parse(cell);
    }),
  );
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

export const getGameTiles = async (
  game: Doc<"games">,
  ctx: QueryCtx,
): Promise<Tile[]> => {
  const gameTiles = await ctx.db
    .query("tiles")
    .withIndex("by_game", (q) => q.eq("gameId", game._id))
    .collect();

  return Promise.all(
    gameTiles.map(async (t) => {
      return tileSchema.parse(t);
    }),
  );
};
