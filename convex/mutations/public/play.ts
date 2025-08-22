import { withSessionMutation } from "../../middleware/sessions";
import { v } from "convex/values";
import { MoveType } from "../internal/move";
import { api, internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { TilesQueryRepository } from "../../repository/query/tiles.repository.ts";
import { PlayersQueryRepository } from "../../repository/query/players.repository.ts";
import { MovesQueryRepository } from "../../repository/query/moves.repository.ts";
import { GamesQueryRepository } from "../../repository/query/games.repository.ts";
import { MovesMutationRepository } from "../../repository/mutations/moves.repository.ts";
import { PlayersMutationRepository } from "../../repository/mutations/players.repository.ts";
import { GamesMutationRepository } from "../../repository/mutations/games.repository.ts";

export const resetTurn = withSessionMutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await GamesQueryRepository.instance.find(gameId);
    if (!game) {
      return;
    }
    if (!ctx.user) {
      return;
    }

    const player = await PlayersQueryRepository.instance.findCurrentPlayer(
      game._id,
    );
    if (!player || player.userId !== ctx.user._id) {
      return;
    }

    const moves =
      await MovesQueryRepository.instance.findAllForCurrentTurn(game);
    let canContinue = true;
    moves.forEach(async (m) => {
      if (!canContinue) {
        return;
      }
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
        // if a tile is moved from the bag to the player during a turn it means that the player played on an operator cell and so fetched a new tile
        // in that case stop the reset as it would contrevene the randomness of the game
        canContinue = false;
        return;
      }

      await MovesMutationRepository.instance.delete(m._id);
    });
  },
});

export const endTurn = withSessionMutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await GamesQueryRepository.instance.find(gameId);
    if (!game) {
      return;
    }
    const currentPlayer =
      await PlayersQueryRepository.instance.findCurrentPlayer(game._id);

    if (!ctx.user || !currentPlayer || currentPlayer.userId !== ctx.user._id) {
      return;
    }

    const turnScore = await ctx.runQuery(api.queries.play.getCurrentTurnScore, {
      gameId,
      sessionId: ctx.sessionId,
    });

    // change the current player to the next one
    const nextPlayer = await PlayersQueryRepository.instance.findNextPlayer(
      game._id,
    );

    if (!nextPlayer) {
      return;
    }

    await PlayersMutationRepository.instance.patch(
      nextPlayer._id as Id<"players">,
      { current: true },
    );

    // update the score of the current playerId
    const currentPlayerTiles = await TilesQueryRepository.instance.findByPlayer(
      currentPlayer._id,
    );
    const additionalScoreForEmptyHand =
      currentPlayerTiles.length === 0 ? 50 : 0;

    await PlayersMutationRepository.instance.patch(
      currentPlayer._id as Id<"players">,
      {
        current: false,
        score: currentPlayer.score + turnScore + additionalScoreForEmptyHand,
      },
    );

    // add the needed tiles to the current player
    const currentTiles = await TilesQueryRepository.instance.findByPlayer(
      currentPlayer._id,
    );
    const neededTiles = 7 - currentTiles.length;

    for (let i = 0; i < neededTiles; i++) {
      const tiles = await TilesQueryRepository.instance.findAllInBagByGame(
        game._id,
      );
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
    await GamesMutationRepository.instance.patch(gameId, {
      currentTurn: game.currentTurn + 1,
    });
  },
});
