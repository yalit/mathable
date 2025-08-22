import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { withSessionMutation } from "../../middleware/sessions";
import { vSessionId } from "convex-helpers/server/sessions";
import { v } from "convex/values";
import { MoveType } from "../internal/move";
import { TilesQueryRepository } from "../../repository/query/tiles.repository.ts";
import { PlayersQueryRepository } from "../../repository/query/players.repository.ts";
import { CellsQueryRepository } from "../../repository/query/cells.repository.ts";
import { GamesQueryRepository } from "../../repository/query/games.repository.ts";

export const playToCell = withSessionMutation({
  args: {
    tileId: v.id("tiles"),
    cellId: v.id("cells"),
    playerId: v.id("players"),
    sessionId: vSessionId,
  },
  handler: async (ctx, { tileId, cellId, playerId }) => {
    const tile = await TilesQueryRepository.instance.find(tileId);
    const player = await PlayersQueryRepository.instance.find(playerId);
    const cell = await CellsQueryRepository.instance.find(cellId);

    if (!(tile && cell && player)) {
      return;
    }

    const game = await GamesQueryRepository.instance.find(tile.gameId);

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

    // recompute values due to cell change
    await ctx.runMutation(
      internal.mutations.internal.cell.computeAllowedValuesFromUpdatedCell,
      { cellId },
    );
  },
});

export const pick = withSessionMutation({
  args: {
    playerId: v.id("players"),
    sessionId: vSessionId,
  },
  handler: async (ctx, { playerId }) => {
    const player = await PlayersQueryRepository.instance.find(playerId);

    if (!player) {
      return;
    }

    const game = await GamesQueryRepository.instance.find(player.gameId);

    if (!game) {
      return;
    }

    if (!ctx.user) {
      return;
    }

    // check that the ctx user is the same as the current game user
    if (ctx.user._id !== player.userId) {
      return;
    }

    const gameTiles = await TilesQueryRepository.instance.findAllInBagByGame(
      game._id,
    );
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
  },
});
