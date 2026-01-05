import { expect, test, describe, beforeEach } from "vitest";
import { api } from "../../../_generated/api";
import type { Id } from "../../../_generated/dataModel";
import schema from "../../../schema";
import { modules } from "../../../test.setup";
import { convexTest, type TestConvex } from "convex-test";
import type { SessionId } from "convex-helpers/server/sessions";
import { GameTestHelper } from "@cvx/tests/GameTest.helper";

describe("EndTurnUseCase", () => {
  let t: TestConvex<typeof schema>;
  let gameHelper: GameTestHelper;

  beforeEach(() => {
    t = convexTest(schema, modules);
    gameHelper = new GameTestHelper(t);
  });

  test("should end turn and switch to next player", async () => {
    // Arrange: Create and start a game
    const { game, players } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    // Get current player before ending turn
    const currentPlayerBefore = players.find((p) => p.current);
    expect(currentPlayerBefore).toBeDefined();

    const { user } = await gameHelper.getCurrentPlayer(game._id);

    // Act: End turn as the current player
    const endTurnResult = await t.mutation(
      api.controllers.play.mutations.endTurn,
      {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      },
    );

    // Assert: Turn ended successfully
    expect(endTurnResult).toMatchObject({
      status: "success",
      data: {
        gameEnded: false,
      },
    });

    // Verify next player is now current
    const { player: currentPlayerAfter } = await gameHelper.getCurrentPlayer(
      game._id,
    );
    expect(currentPlayerAfter).toBeDefined();
    expect(currentPlayerAfter._id).not.toBe(currentPlayerBefore!._id);

    // Verify turn counter incremented
    const updatedGame = await t.run(async (ctx) => {
      return await ctx.db.get(game._id);
    });

    expect(updatedGame?.currentTurn).toBeGreaterThan(1);
  });

  test("should refill player hand to 7 tiles after ending turn", async () => {
    // Arrange: Create and start a game
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    const { player, user } = await gameHelper.getCurrentPlayer(game._id);

    // Count tiles before
    const tilesBefore = await gameHelper.getPlayerTiles(player._id);

    // Act: End turn
    await t.mutation(api.controllers.play.mutations.endTurn, {
      gameId: game._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Player still has 7 tiles (refilled)
    const tilesAfter = await gameHelper.getPlayerTiles(player._id);

    expect(tilesAfter.length).toBe(7);
    expect(tilesBefore.length).toBe(7);
  });

  test("should fail when non-current player tries to end turn", async () => {
    // Arrange: Create and start a game
    const { game, players, users } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    // Get non-current player
    const nonCurrentPlayer = players.find((p) => !p.current)!;
    const nonCurrentPlayerIndex = players.indexOf(nonCurrentPlayer);
    const user = users[nonCurrentPlayerIndex];

    // Act: Try to end turn as non-current player
    const result = await t.mutation(api.controllers.play.mutations.endTurn, {
      gameId: game._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Should fail
    expect(result).toMatchObject({
      status: "error",
      data: expect.stringContaining("current player"),
    });
  });

  test("should cycle through all players in correct order", async () => {
    // Arrange: Create a game with 3 players
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2", "Player 3"],
    });

    // Track player turn order
    const turnOrder: Id<"players">[] = [];

    // Act: End turn 3 times to cycle through all players
    for (let i = 0; i < 3; i++) {
      const { player, user } = await gameHelper.getCurrentPlayer(game._id);
      turnOrder.push(player._id);

      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });
    }

    // Assert: All players had a turn and no duplicates
    expect(turnOrder.length).toBe(3);
    expect(new Set(turnOrder).size).toBe(3);

    // After 3 turns, we should be back to the first player
    const { player: currentPlayer } = await gameHelper.getCurrentPlayer(
      game._id,
    );
    expect(currentPlayer._id).toBe(turnOrder[0]);
  });

  test("should increment turn counter each time", async () => {
    // Arrange: Create and start a game
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    const initialTurn = game.currentTurn;

    // Act: End turn multiple times
    for (let i = 0; i < 3; i++) {
      const { user } = await gameHelper.getCurrentPlayer(game._id);

      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });
    }

    // Assert: Turn counter incremented by 3
    const gameAfter = await t.run(async (ctx) => {
      return await ctx.db.get(game._id);
    });

    expect(gameAfter!.currentTurn).toBe(initialTurn + 3);
  });

  describe("Idle game detection (Phase 1)", () => {
    test("should not detect idle if PLAYER_TO_CELL move exists within 2 rounds", async () => {
      // Arrange: Create game with 2 players
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [
          [1, 2, 3, 4, 5, 6, 7],
          [1, 2, 3, 4, 5, 6, 7],
        ],
      });

      // Round 1: Both players play tiles
      for (let i = 0; i < 2; i++) {
        const { player, user } = await gameHelper.getCurrentPlayer(game._id);
        const { tile, cell } = await gameHelper.findValidTileCellPair(game._id);

        await t.mutation(api.controllers.tile.mutations.playToCell, {
          tileId: tile._id,
          cellId: cell._id,
          playerId: player._id,
          sessionId: user.sessionId as SessionId,
        });

        await t.mutation(api.controllers.play.mutations.endTurn, {
          gameId: game._id,
          sessionId: user.sessionId as SessionId,
        });
      }

      // Round 2: Only first player plays
      const { player, user } = await gameHelper.getCurrentPlayer(game._id);
      const { tile, cell } = await gameHelper.findValidTileCellPair(game._id);

      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile._id,
        cellId: cell._id,
        playerId: player._id,
        sessionId: user.sessionId as SessionId,
      });

      // Act: End turn - should NOT be idle (last PLAYER_TO_CELL is current turn)
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game should continue
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(false);
    });

    test("should end game as idle with highest scorer as winner", async () => {
      // Arrange: Create game with 2 players
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [
          [1, 2, 3, 4, 5, 6, 7],
          [1, 2, 3, 4, 5, 6, 7],
        ],
      });

      // Round 1: Player 1 plays and scores points
      let { player, user } = await gameHelper.getCurrentPlayer(game._id);
      let { tile, cell } = await gameHelper.findValidTileCellPair(game._id);

      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile._id,
        cellId: cell._id,
        playerId: player._id,
        sessionId: user.sessionId as SessionId,
      });

      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Player 2 just ends turn without scoring
      ({ user } = await gameHelper.getCurrentPlayer(game._id));
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Get scores after round 1
      const player1AfterR1 = await t.run(async (ctx) => {
        return await ctx.db.get(players[0]._id);
      });
      const player2AfterR1 = await t.run(async (ctx) => {
        return await ctx.db.get(players[1]._id);
      });

      // Player 1 should have higher score
      expect(player1AfterR1!.score).toBeGreaterThan(player2AfterR1!.score);

      // Rounds 2-3: Both players just end turns (no placements)
      for (let i = 0; i < 4; i++) {
        ({ user } = await gameHelper.getCurrentPlayer(game._id));
        await t.mutation(api.controllers.play.mutations.endTurn, {
          gameId: game._id,
          sessionId: user.sessionId as SessionId,
        });
      }

      // Act: End turn to trigger idle
      ({ user } = await gameHelper.getCurrentPlayer(game._id));
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game ended with highest scorer as winner
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(true);

      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ended");
      expect(updatedGame?.winner).toBe(players[0]._id); // Player 1 had higher score
    });

    test("should handle tie in idle scenario - first by order wins", async () => {
      // Arrange: Create game where both players have same score (0)
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      // Neither player scores anything, just idle out the game
      for (let i = 0; i < 4; i++) {
        const { user } = await gameHelper.getCurrentPlayer(game._id);
        await t.mutation(api.controllers.play.mutations.endTurn, {
          gameId: game._id,
          sessionId: user.sessionId as SessionId,
        });
      }

      // Act: Trigger idle
      const { user } = await gameHelper.getCurrentPlayer(game._id);
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game ended with player with lowest order (player 0) as winner
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(true);

      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ended");

      // Get all players to determine minimum order
      const allPlayers = await t.run(async (ctx) => {
        return await ctx.db
          .query("players")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // In case of tie, player with lower order number should win
      const winner = await t.run(async (ctx) => {
        return await ctx.db.get(updatedGame!.winner!);
      });

      // Expect the player with the lowest order to win
      const minOrder = Math.min(...allPlayers.map((p) => p.order));
      expect(winner?.order).toBe(minOrder);
    });

    test("should not apply tile bonuses or penalties in idle win", async () => {
      // Arrange: Create game with 2 players
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [
          [1, 2, 3, 4, 5, 6, 7],
          [1, 2, 3, 4, 5, 6, 7],
        ],
      });

      // Player 1 scores some points
      let { player, user } = await gameHelper.getCurrentPlayer(game._id);
      let { tile, cell } = await gameHelper.findValidTileCellPair(game._id);

      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile._id,
        cellId: cell._id,
        playerId: player._id,
        sessionId: user.sessionId as SessionId,
      });

      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Player 2 ends turn
      ({ user } = await gameHelper.getCurrentPlayer(game._id));
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Get scores before idle
      const player1BeforeIdle = await t.run(async (ctx) => {
        return await ctx.db.get(players[0]._id);
      });
      const player2BeforeIdle = await t.run(async (ctx) => {
        return await ctx.db.get(players[1]._id);
      });

      const scoreBeforeP1 = player1BeforeIdle!.score;
      const scoreBeforeP2 = player2BeforeIdle!.score;

      // Idle out the game
      for (let i = 0; i < 4; i++) {
        ({ user } = await gameHelper.getCurrentPlayer(game._id));
        await t.mutation(api.controllers.play.mutations.endTurn, {
          gameId: game._id,
          sessionId: user.sessionId as SessionId,
        });
      }

      // Act: Trigger idle
      ({ user } = await gameHelper.getCurrentPlayer(game._id));
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Scores should remain unchanged (no tile bonuses/penalties)
      const player1AfterIdle = await t.run(async (ctx) => {
        return await ctx.db.get(players[0]._id);
      });
      const player2AfterIdle = await t.run(async (ctx) => {
        return await ctx.db.get(players[1]._id);
      });

      expect(player1AfterIdle!.score).toBe(scoreBeforeP1);
      expect(player2AfterIdle!.score).toBe(scoreBeforeP2);
    });
  });

  test("should handle tile bag running empty", async () => {
    // Arrange: Create and start a game
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    // Remove all tiles from bag except a few
    await t.run(async (ctx) => {
      const tiles = await ctx.db
        .query("tiles")
        .withIndex("by_game_location", (q) =>
          q.eq("gameId", game._id).eq("location", "in_bag"),
        )
        .collect();

      // Delete all but 3 tiles from bag
      for (let i = 3; i < tiles.length; i++) {
        await ctx.db.delete(tiles[i]._id);
      }
    });

    const { user } = await gameHelper.getCurrentPlayer(game._id);

    // Act: End turn (should try to refill but won't have enough tiles)
    const result = await t.mutation(api.controllers.play.mutations.endTurn, {
      gameId: game._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Turn ended successfully even with empty bag
    expect(result.status).toBe("success");

    // Verify bag is now empty or nearly empty
    const tilesInBag = await t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_game_location", (q) =>
          q.eq("gameId", game._id).eq("location", "in_bag"),
        )
        .collect();
    });

    expect(tilesInBag.length).toBeLessThan(7);
  });
});
