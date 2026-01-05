import { expect, test, describe, beforeEach } from "vitest";
import { api } from "../../_generated/api";
import schema from "../../schema";
import { modules } from "../../test.setup";
import { convexTest, type TestConvex } from "convex-test";
import type { SessionId } from "convex-helpers/server/sessions";
import { GameTestHelper } from "../GameTest.helper";

describe("FinalScoreService", () => {
  let t: TestConvex<typeof schema>;
  let gameHelper: GameTestHelper;

  beforeEach(() => {
    t = convexTest(schema, modules);
    gameHelper = new GameTestHelper(t);
  });

  describe("calculateAndApplyFinalScores()", () => {
    test("should add opponent tile values to winner score", async () => {
      // Arrange: Create game with 2 players
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Winner", "Loser"],
        playerTileValues: [
          [], // Winner has no tiles (empties hand)
          [1, 2, 3, 4, 5, 6, 7], // Loser has specific tiles totaling 28
        ],
      });

      // Remove all winner's tiles to trigger win condition
      const winnerTiles = await gameHelper.getPlayerTiles(players[0]._id);
      for (const tile of winnerTiles) {
        await t.run(async (ctx) => {
          await ctx.db.delete(tile._id);
        });
      }

      // Empty the bag
      await gameHelper.emptyTileBag(game._id);

      // Set initial scores for both players
      await t.run(async (ctx) => {
        await ctx.db.patch(players[0]._id, { score: 50 }); // Winner starts with 50
        await ctx.db.patch(players[1]._id, { score: 30 }); // Loser starts with 30
      });

      const { user } = await gameHelper.getCurrentPlayer(game._id);

      // Act: End turn (should trigger win and final scoring)
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game ended
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(true);

      // Get updated players
      const winnerAfter = await t.run(async (ctx) => {
        return await ctx.db.get(players[0]._id);
      });
      const loserAfter = await t.run(async (ctx) => {
        return await ctx.db.get(players[1]._id);
      });

      // Winner should have: 50 + (1+2+3+4+5+6+7) = 50 + 28 = 78
      expect(winnerAfter?.score).toBe(78);

      // Loser should have: 30 - (1+2+3+4+5+6+7) = 30 - 28 = 2
      expect(loserAfter?.score).toBe(2);
    });

    test("should handle multiple opponents (3 players)", async () => {
      // Arrange: Create game with 3 players
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Winner", "Loser1", "Loser2"],
        playerTileValues: [
          [], // Winner has no tiles (will delete any random tiles)
          [1, 2, 3, 1, 1, 2, 2], // Loser1 has tiles totaling 12 (1+2+3+1+1+2+2)
          [4, 5, 6, 2, 2, 3, 3], // Loser2 has tiles totaling 25 (4+5+6+2+2+3+3)
        ],
      });

      // Remove all winner's tiles
      const winnerTiles = await gameHelper.getPlayerTiles(players[0]._id);
      for (const tile of winnerTiles) {
        await t.run(async (ctx) => {
          await ctx.db.delete(tile._id);
        });
      }

      // Empty the bag
      await gameHelper.emptyTileBag(game._id);

      // Set initial scores
      await t.run(async (ctx) => {
        await ctx.db.patch(players[0]._id, { score: 100 }); // Winner
        await ctx.db.patch(players[1]._id, { score: 50 }); // Loser1
        await ctx.db.patch(players[2]._id, { score: 40 }); // Loser2
      });

      const { user } = await gameHelper.getCurrentPlayer(game._id);

      // Act: End turn (should trigger win and final scoring)
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Check all player scores
      const winnerAfter = await t.run(async (ctx) => {
        return await ctx.db.get(players[0]._id);
      });
      const loser1After = await t.run(async (ctx) => {
        return await ctx.db.get(players[1]._id);
      });
      const loser2After = await t.run(async (ctx) => {
        return await ctx.db.get(players[2]._id);
      });

      // Winner gets: 100 + 12 + 25 = 137
      expect(winnerAfter?.score).toBe(137);

      // Loser1 loses: 50 - 12 = 38
      expect(loser1After?.score).toBe(38);

      // Loser2 loses: 40 - 25 = 15
      expect(loser2After?.score).toBe(15);
    });

    test("should handle negative scores after final scoring", async () => {
      // Arrange: Create game where loser score goes negative
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Winner", "Loser"],
        playerTileValues: [
          [], // Winner has no tiles (will delete any random tiles)
          [7, 8, 9, 1, 1, 1, 1], // Loser has tiles totaling 28 (7+8+9+1+1+1+1)
        ],
      });

      // Remove all winner's tiles
      const winnerTiles = await gameHelper.getPlayerTiles(players[0]._id);
      for (const tile of winnerTiles) {
        await t.run(async (ctx) => {
          await ctx.db.delete(tile._id);
        });
      }

      // Empty the bag
      await gameHelper.emptyTileBag(game._id);

      // Set initial scores - loser has low score
      await t.run(async (ctx) => {
        await ctx.db.patch(players[0]._id, { score: 50 }); // Winner
        await ctx.db.patch(players[1]._id, { score: 10 }); // Loser - will go negative
      });

      const { user } = await gameHelper.getCurrentPlayer(game._id);

      // Act: End turn
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Loser score should be negative
      const loserAfter = await t.run(async (ctx) => {
        return await ctx.db.get(players[1]._id);
      });

      // Loser: 10 - 28 = -18
      expect(loserAfter?.score).toBe(-18);
    });

    test("should not apply final scoring in idle win", async () => {
      // Arrange: Create game that will end as idle
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [
          [1, 2, 3, 4, 5, 6, 7],
          [1, 2, 3, 4, 5, 6, 7],
        ],
      });

      // Set initial scores
      await t.run(async (ctx) => {
        await ctx.db.patch(players[0]._id, { score: 50 }); // Higher score
        await ctx.db.patch(players[1]._id, { score: 30 });
      });

      // Play one tile to start, then idle out
      const { tile, cell, player } = await gameHelper.findValidTileCellPair(
        game._id,
      );
      const { user: user1 } = await gameHelper.getCurrentPlayer(game._id);

      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile._id,
        cellId: cell._id,
        playerId: player._id,
        sessionId: user1.sessionId as SessionId,
      });

      // End turn without placing tiles for 2 full rounds (4 turns for 2 players)
      for (let i = 0; i < 5; i++) {
        const { user } = await gameHelper.getCurrentPlayer(game._id);
        await t.mutation(api.controllers.play.mutations.endTurn, {
          gameId: game._id,
          sessionId: user.sessionId as SessionId,
        });
      }

      // Assert: Scores should NOT have tile penalties/bonuses applied
      const player1After = await t.run(async (ctx) => {
        return await ctx.db.get(players[0]._id);
      });
      const player2After = await t.run(async (ctx) => {
        return await ctx.db.get(players[1]._id);
      });

      // Scores should be unchanged except for the one tile placed
      // Player 1 should have won (higher score) but no tile bonuses
      expect(player1After?.score).toBeGreaterThanOrEqual(50); // At least initial score (may have scored from placed tile)
      expect(player2After?.score).toBe(30); // Unchanged (didn't play)

      // Verify neither player has tile penalties (score - 28 from 7 tiles) or bonuses
      expect(player1After?.score).toBeLessThan(50 + 28); // Shouldn't have gotten opponent's tiles
      expect(player2After?.score).toBeGreaterThan(30 - 28); // Shouldn't have lost tile value
    });

    test("should calculate opponent tile sum correctly with various tile values", async () => {
      // Arrange: Test with different tile values
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Winner", "Loser"],
        playerTileValues: [
          [], // Winner has no tiles (will delete any random tiles)
          [2, 3, 9, 5, 4, 1, 1], // Loser has specific values totaling 25 (2+3+9+5+4+1+1)
        ],
      });

      // Remove all winner's tiles
      const winnerTiles = await gameHelper.getPlayerTiles(players[0]._id);
      for (const tile of winnerTiles) {
        await t.run(async (ctx) => {
          await ctx.db.delete(tile._id);
        });
      }

      // Empty the bag
      await gameHelper.emptyTileBag(game._id);

      // Set initial scores
      await t.run(async (ctx) => {
        await ctx.db.patch(players[0]._id, { score: 0 }); // Winner starts at 0
        await ctx.db.patch(players[1]._id, { score: 20 }); // Loser starts at 20
      });

      const { user } = await gameHelper.getCurrentPlayer(game._id);

      // Act: End turn
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert
      const winnerAfter = await t.run(async (ctx) => {
        return await ctx.db.get(players[0]._id);
      });
      const loserAfter = await t.run(async (ctx) => {
        return await ctx.db.get(players[1]._id);
      });

      // Winner: 0 + 25 = 25
      expect(winnerAfter?.score).toBe(25);

      // Loser: 20 - 25 = -5
      expect(loserAfter?.score).toBe(-5);
    });
  });
});
