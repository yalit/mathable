import type { Id } from "@cvx/_generated/dataModel";
import { internal } from "../../_generated/api";
import { getGameBagTiles } from "../../helpers/game";
import { mutationWithSession } from "../../middleware/sessions";
import { vSessionId } from "convex-helpers/server/sessions";
import { v } from "convex/values";
import { MoveType } from "../internal/move";

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

    await ctx.runMutation(internal.mutations.internal.tile.moveToCell, {
      tileId,
      cellId,
    });

    await ctx.runMutation(internal.mutations.internal.move.createMove, {
      gameId: game._id,
      type: MoveType.PLAYER_TO_CELL,
      turn: game.currentTurn,
      cellId: cellId,
      tileId: tileId,
      playerId: playerId,
      moveScore: cell.multiplier ? cell.multiplier * tile.value : tile.value,
    });

    // if cell is an operator one, draw a new tile for the player
    if (cell.type === "operator") {
      const gameTiles = await getGameBagTiles(game, ctx);
      if (gameTiles.length > 0) {
        gameTiles.sort(() => Math.random() - 0.5);

        const movedTile = gameTiles[0];
        await ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
          tileId: movedTile._id as Id<"tiles">,
          playerId,
        });

        await ctx.runMutation(internal.mutations.internal.move.createMove, {
          gameId: game._id,
          type: MoveType.BAG_TO_PLAYER,
          turn: game.currentTurn,
          cellId: null,
          tileId: movedTile._id as Id<"tiles">,
          playerId: playerId,
          moveScore: 0,
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
