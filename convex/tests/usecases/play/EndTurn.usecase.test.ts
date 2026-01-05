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

  describe("Generic End turn action", () => {
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
      const { player } = await gameHelper.getCurrentPlayer(game._id);
      let { user } = await gameHelper.getCurrentPlayer(game._id);
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
      const { game } = await gameHelper.createGame({
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
      const { player } = await gameHelper.getCurrentPlayer(game._id);
      let { user } = await gameHelper.getCurrentPlayer(game._id);
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

  describe("Regular win (Phase 2)", () => {
    test("should end game when player empties hand with empty bag", async () => {
      // Arrange: Create game with specific tiles
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Winner", "Loser"],
        playerTileValues: [
          [1, 2, 3, 4, 5, 6, 7], // Winner starts with 7 tiles
          [1, 2, 3, 4, 5, 6, 7], // Loser has tiles
        ],
      });

      // Set initial scores
      await t.run(async (ctx) => {
        await ctx.db.patch(players[0]._id, { score: 50 });
        await ctx.db.patch(players[1]._id, { score: 30 });
      });

      // Remove all tiles from winner except 1
      const winnerTiles = await gameHelper.getPlayerTiles(players[0]._id);
      for (let i = 1; i < winnerTiles.length; i++) {
        await t.run(async (ctx) => {
          await ctx.db.delete(winnerTiles[i]._id);
        });
      }

      // Empty the bag
      await gameHelper.emptyTileBag(game._id);

      // Place the last tile (winner is current player initially)
      const { tile, cell } = await gameHelper.findValidTileCellPair(game._id);
      const { user: winnerUser } = await gameHelper.getCurrentPlayer(game._id);

      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile._id,
        cellId: cell._id,
        playerId: players[0]._id,
        sessionId: winnerUser.sessionId as SessionId,
      });

      // Act: End turn - should trigger win
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: winnerUser.sessionId as SessionId,
      });

      // Assert: Game ended
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(true);

      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ended");
      expect(updatedGame?.winner).toBe(players[0]._id);
    });

    test("should apply final scoring on regular win", async () => {
      // Arrange: Similar setup to first win test, but check scores
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Winner", "Loser"],
        playerTileValues: [
          [1, 2, 3, 4, 5, 6, 7], // Winner starts with 7 tiles
          [1, 2, 3, 4, 5, 6, 7], // Loser has 7 tiles (value = 28)
        ],
      });

      // Record initial scores
      const initialScores = await t.run(async (ctx) => {
        const p0 = await ctx.db.get(players[0]._id);
        const p1 = await ctx.db.get(players[1]._id);
        return [p0!.score, p1!.score];
      });

      // Remove all winner's tiles except 1
      const winnerTiles = await gameHelper.getPlayerTiles(players[0]._id);
      for (let i = 1; i < winnerTiles.length; i++) {
        await t.run(async (ctx) => {
          await ctx.db.delete(winnerTiles[i]._id);
        });
      }

      // Empty the bag
      await gameHelper.emptyTileBag(game._id);

      // Place the last tile
      const { tile, cell } = await gameHelper.findValidTileCellPair(game._id);
      const { user: winnerUser } = await gameHelper.getCurrentPlayer(game._id);

      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile._id,
        cellId: cell._id,
        playerId: players[0]._id,
        sessionId: winnerUser.sessionId as SessionId,
      });

      // Act: End turn - should trigger win and final scoring
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: winnerUser.sessionId as SessionId,
      });

      // Assert: Game ended with final scoring
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(true);

      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });
      expect(updatedGame?.status).toBe("ended");

      // Get final scores
      const finalScores = await t.run(async (ctx) => {
        const p0 = await ctx.db.get(players[0]._id);
        const p1 = await ctx.db.get(players[1]._id);
        return [p0!.score, p1!.score];
      });

      // Determine winner/loser (winner is whoever won the game)
      const winnerIdx = updatedGame!.winner === players[0]._id ? 0 : 1;
      const loserIdx = 1 - winnerIdx;

      // Winner should have gained points (opponent's tile values)
      expect(finalScores[winnerIdx]).toBeGreaterThan(initialScores[winnerIdx]);

      // Loser should have lost points (28 points for 7 tiles)
      expect(finalScores[loserIdx]).toBe(initialScores[loserIdx] - 28);
    });

    test("should not end game if bag has tiles even if hand empty", async () => {
      // Arrange: Create game with empty hand but tiles in bag
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [
          [1], // Player 1 has 1 tile
          [1, 2, 3, 4, 5, 6, 7],
        ],
      });

      // Place the tile
      const { tile, cell } = await gameHelper.findValidTileCellPair(game._id);
      const { user } = await gameHelper.getCurrentPlayer(game._id);

      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile._id,
        cellId: cell._id,
        playerId: players[0]._id,
        sessionId: user.sessionId as SessionId,
      });

      // Act: End turn - should NOT end game (bag still has tiles)
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game continues
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(false);

      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ongoing");
    });

    test("should not end game if player has tiles even if bag empty", async () => {
      // Arrange: Create game with tiles in hand but empty bag
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      // Empty the bag
      await gameHelper.emptyTileBag(game._id);

      const { user } = await gameHelper.getCurrentPlayer(game._id);

      // Act: End turn - should NOT end game (player still has tiles)
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game continues
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(false);

      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ongoing");
    });
  });
});
