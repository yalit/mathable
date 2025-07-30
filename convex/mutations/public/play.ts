import {
  getGameCurrentPlayer,
  getGameCurrentTurnMoves,
  getGameNextPlayer,
  getGameBagTiles,
} from "../../helpers/game";
import { mutationWithSession } from "../../middleware/sessions";
import { v } from "convex/values";
import { MoveType } from "../internal/move";
import { api, internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { getPlayerTiles } from "../../helpers/player";

export const resetTurn = mutationWithSession({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) {
      return;
    }
    if (!ctx.user) {
      return;
    }

    const player = await getGameCurrentPlayer(game, ctx);
    if (!player || player.userId !== ctx.user._id) {
      return;
    }

    const moves = await getGameCurrentTurnMoves(game, ctx);
    moves.forEach(async (m) => {
      if (m.type === MoveType.PLAYER_TO_CELL) {
        if (!(m.cellId && m.tileId && m.playerId)) {
          return;
        }
        await ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
          tileId: m.tileId,
          playerId: m.playerId,
        });
        await ctx.runMutation(
          internal.mutations.internal.cell.computeAllowedValuesFromUpdatedCell,
          { cellId: m.cellId },
        );
      }
      if (m.type === MoveType.BAG_TO_PLAYER) {
        if (!m.tileId) {
          return;
        }
        await ctx.runMutation(internal.mutations.internal.tile.moveToBag, {
          tileId: m.tileId,
        });
      }

      await ctx.db.delete(m._id);
    });
  },
});

export const endTurn = mutationWithSession({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) {
      return;
    }
    const currentPlayer = await getGameCurrentPlayer(game, ctx);

    if (!ctx.user || !currentPlayer || currentPlayer.userId !== ctx.user._id) {
      return;
    }

    const turnScore = await ctx.runQuery(api.queries.play.getCurrentTurnScore, {
      gameId,
      sessionId: ctx.sessionId,
    });

    // change the current player to the next one
    const nextPlayer = await getGameNextPlayer(game, ctx);

    if (!nextPlayer) {
      return;
    }

    await ctx.db.patch(nextPlayer._id as Id<"players">, { current: true });

    // update the score of the current playerId
    const currentPlayerTiles = await getPlayerTiles(currentPlayer, ctx);
    const additionalScoreForEmptyHand =
      currentPlayerTiles.length === 0 ? 50 : 0;

    await ctx.db.patch(currentPlayer._id as Id<"players">, {
      current: false,
      score: currentPlayer.score + turnScore + additionalScoreForEmptyHand,
    });

    // add the needed tiles to the current player
    const currentTiles = await getPlayerTiles(currentPlayer, ctx);
    const neededTiles = 7 - currentTiles.length;

    for (let i = 0; i < neededTiles; i++) {
      const tiles = await getGameBagTiles(game, ctx);
      tiles
        .sort(() => Math.random() - 0.5)
        .slice(0, 1)
        .forEach(async (t) => {
          await ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
            tileId: t._id as Id<"tiles">,
            playerId: currentPlayer._id as Id<"players">,
          });
        });
    }

    // update the current turn to + 1
    await ctx.db.patch(gameId, { currentTurn: game.currentTurn + 1 });
  },
});
