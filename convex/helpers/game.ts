import { tileSchema } from "../../src/context/model/tile";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export const getGame = async (
  gameId: Id<"games">,
  ctx: QueryCtx,
): Promise<Doc<"games"> | null> => {
  return await ctx.db.get(gameId);
};

export const getGameCells = async (
  game: Doc<"games">,
  ctx: QueryCtx,
): Promise<Doc<"cells">[]> => {
  return await ctx.db
    .query("cells")
    .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
    .collect();
};

export const getGamePlayers = async (
  game: Doc<"games">,
  ctx: QueryCtx,
): Promise<Doc<"players">[]> => {
  return await ctx.db
    .query("players")
    .withIndex("by_game", (q) => q.eq("gameId", game._id))
    .collect();
};

export const getGameCurrentPlayer = async (
  game: Doc<"games">,
  ctx: QueryCtx,
): Promise<Doc<"players"> | null> => {
  const players = await getGamePlayers(game, ctx);
  const current = players.filter((p) => p.current);

  if (current.length !== 1) {
    return null;
  }

  return current[0];
};

export const getGameNextPlayer = async (
  game: Doc<"games">,
  ctx: QueryCtx,
): Promise<Doc<"players"> | null> => {
  const current = await getGameCurrentPlayer(game, ctx);
  if (!current) {
    return null;
  }
  const players = await getGamePlayers(game, ctx);

  const nextOrder = current.order < players.length ? current.order + 1 : 1;
  const next = players.filter((p) => p.order === nextOrder);

  if (next.length !== 1) {
    return null;
  }
  return next[0];
};

export const getGameBagTiles = async (
  game: Doc<"games">,
  ctx: QueryCtx,
): Promise<Doc<"tiles">[]> => {
  return await ctx.db
    .query("tiles")
    .withIndex("by_game_location", (q) =>
      q.eq("gameId", game._id).eq("location", "in_bag"),
    )
    .collect();
};

export const getGameCurrentTurnMoves = async (
  game: Doc<"games">,
  ctx: QueryCtx,
): Promise<Doc<"moves">[]> => {
  return await ctx.db
    .query("moves")
    .withIndex("by_turn", (q) =>
      q.eq("gameId", game._id).eq("turn", game.currentTurn),
    )
    .order("desc")
    .collect();
};
