import { tileSchema, type Tile } from "../../src/context/model/tile";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export const getPlayerTiles = async (
  player: Doc<"players">,
  ctx: QueryCtx,
): Promise<Tile[]> => {
  const tiles = await ctx.db
    .query("tiles")
    .withIndex("by_player", (q) =>
      q.eq("playerId", player._id).eq("location", "in_hand"),
    )
    .collect();

  return tiles.map((t) => tileSchema.parse(t));
};
