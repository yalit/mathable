import { internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import { v } from "convex/values";
import { vSessionId } from "convex-helpers/server/sessions";
import { withSessionMutation } from "../../middleware/sessions";
import { withRepositoryMutation } from "../../middleware/repository.middleware.ts";
import { PlayersQueryRepository } from "../../repository/query/players.repository.ts";
import { GamesQueryRepository } from "../../repository/query/games.repository.ts";
import { TilesQueryRepository } from "../../repository/query/tiles.repository.ts";
import { GamesMutationRepository } from "../../repository/mutations/games.repository.ts";
import { PlayersMutationRepository } from "../../repository/mutations/players.repository.ts";
import { CreateGameUseCase } from "../../usecases/game/CreateGame.usecase.ts";

/**
 * Create a new game
 * Thin adapter that delegates to CreateGameUseCase
 */
export const create = withRepositoryMutation({
  args: { playerName: v.string(), sessionId: vSessionId },
  handler: async (ctx, args) => {
    const useCase = new CreateGameUseCase(ctx);
    return await useCase.execute(args.playerName, args.sessionId);
  },
});

export const join = withRepositoryMutation({
  args: {
    gameId: v.id("games"),
    playerName: v.string(),
    sessionId: vSessionId,
  },
  handler: async (ctx, args): Promise<{ success: boolean; token: string }> => {
    const game = await GamesQueryRepository.instance.find(args.gameId);
    if (!game) {
      return { success: false, token: "" };
    }

    const players = await PlayersQueryRepository.instance.findByGame(game._id);

    if (players.length >= 4) {
      return { success: false, token: "" };
    }

    const playerId = await ctx.runMutation(
      internal.mutations.internal.player.create,
      { gameId: args.gameId, name: args.playerName, sessionId: args.sessionId },
    );

    const player = await PlayersQueryRepository.instance.find(playerId);

    return { success: player !== null, token: player?.token ?? "" };
  },
});

export const start = withSessionMutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game: Doc<"games"> | null =
      await GamesQueryRepository.instance.find(gameId);

    if (!game) {
      return;
    }

    if (!ctx.user) {
      return;
    }

    const players = await PlayersQueryRepository.instance.findByGame(game._id);
    const owner = players.filter((p) => p.owner);
    if (owner.length === 0 || owner[0].userId !== ctx.user._id) {
      return;
    }

    // change the status & setup the currentTurn
    await GamesMutationRepository.instance.patch(game._id, {
      status: "ongoing",
      currentTurn: 1,
    });

    // set the random order for the players
    // set the current player to the player with order 1
    // randomize the order
    players.sort(() => Math.random() - 0.5);
    for (const p of players) {
      const idx = players.indexOf(p);
      await PlayersMutationRepository.instance.patch(p._id as Id<"players">, {
        order: idx + 1,
        current: idx === 0,
      });
    }

    // set the tiles for each users
    for (const p of players) {
      const tiles = await TilesQueryRepository.instance.findAllInBagByGame(
        game._id,
      );
      tiles.sort(() => Math.random() - 0.5);
      for (const t of tiles.slice(0, 7)) {
        await ctx.runMutation(internal.mutations.internal.tile.moveToPlayer, {
          tileId: t._id as Id<"tiles">,
          playerId: p._id as Id<"players">,
        });
      }
    }
  },
});

//TODO : implement endGame
export const endGame = {};
