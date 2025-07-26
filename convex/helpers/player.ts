import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export const getPlayer = async (
  id: Id<"players">,
  ctx: QueryCtx,
): Promise<Doc<"players"> | null> => {
  return await ctx.db.get(id);
};

export const getPlayerTiles = async (
  player: Doc<"players">,
  ctx: QueryCtx,
): Promise<Doc<"tiles">[]> => {
  return await ctx.db
    .query("tiles")
    .withIndex("by_player", (q) =>
      q.eq("playerId", player._id).eq("location", "in_hand"),
    )
    .collect();
};
