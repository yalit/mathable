import type { Id } from "@cvx/_generated/dataModel";
import { internal } from "../../_generated/api";
import { getGameTiles } from "../../helpers/game";
import { mutationWithSession } from "../../middleware/sessions";
import { vSessionId } from "convex-helpers/server/sessions";
import { v } from "convex/values";

export const playToCell = mutationWithSession({
  args: {
    tileId: v.id("tiles"),
    cellId: v.id("cells"),
    playerId: v.id("players"),
    sessionId: vSessionId,
  },
  handler: async (ctx, { tileId, cellId, playerId }) => {
    const tile = await ctx.db.get(tileId);
    const player = await ctx.db.get(playerId);
    const cell = await ctx.db.get(cellId);

    if (!(tile && cell && player)) {
      return;
    }

    const game = await ctx.db.get(tile.gameId);

    if (!game) {
      return;
    }

    if (!ctx.user) {
      return;
    }
    // check if tile is well in hand
    if (tile.location !== "in_hand" || tile.playerId !== player._id) {
      return;
    }

    // check that the ctx user is the same as the current game user
    if (ctx.user._id !== player.userId) {
      return;
    }

    // remove playerId and add cellId to the tile and change location of tile
    await ctx.db.patch(tileId, {
      playerId: null,
      cellId,
      location: "on_board",
    });

    // add tileId to cell
    await ctx.db.patch(cellId, { tileId });

    // update score for player
    await ctx.db.patch(playerId, {
      score:
        player.score +
        (cell.multiplier ? tile.value * cell.multiplier : tile.value),
    });

    // if cell is an operator one, draw a new tile for the player
    if (cell.type === "operator") {
      const gameTiles = await getGameTiles(game, ctx);
      if (gameTiles.length > 0) {
        gameTiles
          .sort(() => Math.random() - 0.5)
          .filter((t) => t.location === "in_bag");
        await ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
          tileId: gameTiles[0]._id as Id<"tiles">,
          playerId,
        });
      }
    }

    // recompute values due to cell change
    await ctx.runMutation(
      internal.mutations.internal.cell.computeAllowedValuesFromUpdatedCell,
      { cellId },
    );
  },
});
