import { v } from "convex/values";
import {withRepositoryInternalMutation} from "../../middleware/repository.middleware.ts";

export const moveToPlayer = withRepositoryInternalMutation({
  args: {
    tileId: v.id("tiles"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { tileId, playerId }) => {
    const tile = await ctx.db.get(tileId);
    if (!tile) {
      return;
    }

    const game = await ctx.db.get(tile.gameId);
    if (!game) {
      return;
    }
    // remove the tile from any Cell
    const cell = await ctx.db
      .query("cells")
      .withIndex("by_tile", (q) => q.eq("tileId", tileId))
      .unique();

    if (cell !== null) {
      await ctx.db.patch(cell._id, { tileId: null });
    }

    // move the tile to the player and change its status
    await ctx.db.patch(tileId, { playerId, location: "in_hand", cellId: null });
  },
});

export const moveToCell = withRepositoryInternalMutation({
  args: { tileId: v.id("tiles"), cellId: v.id("cells") },
  handler: async (ctx, { tileId, cellId }) => {
    // move the tile to cell
    await ctx.db.patch(cellId, { tileId });
    // remove the tile from the player
    await ctx.db.patch(tileId, {
      playerId: null,
      cellId,
      location: "on_board",
    });
  },
});

export const moveToBag = withRepositoryInternalMutation({
  args: { tileId: v.id("tiles") },
  handler: async (ctx, { tileId }) => {
    const tile = await ctx.db.get(tileId);
    if (!tile) {
      return;
    }

    if (tile.cellId) {
      await ctx.db.patch(tile.cellId, { tileId: null });
    }

    await ctx.db.patch(tileId, {
      cellId: null,
      playerId: null,
      location: "in_bag",
    });
  },
});
