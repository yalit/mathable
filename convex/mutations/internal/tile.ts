import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";

export const moveToPlayer = internalMutation({
  args: { tileId: v.id("tiles"), playerId: v.id("players") },
  handler: async (ctx, { tileId, playerId }) => {
    // remove the tile from any Cell
    const cell = await ctx.db
      .query("cells")
      .withIndex("by_tile", (q) => q.eq("tileId", tileId))
      .unique();

    if (cell !== null) {
      await ctx.db.patch(cell._id, { tileId: null });
    }

    // move the tile to the player and change its status
    await ctx.db.patch(tileId, { playerId, location: "in_hand" });
  },
});
