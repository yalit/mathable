import { expect, test, describe, beforeEach } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import type { SessionId } from "convex-helpers/server/sessions";
import { api } from "@cvx/_generated/api";
import schema from "@cvx/schema";
import { modules } from "@cvx/test.setup";
import { GameTestHelper } from "@cvx/tests/GameTest.helper";

/**
 * Tests for EndGameService
 *
 * Since the EndGameService is accessed through the container which is only
 * available in Convex functions, we test it through the EndTurn usecase
 * which uses the service. This tests the actual behavior of the service.
 */
describe("EndGameService", () => {
  let t: TestConvex<typeof schema>;
  let gameHelper: GameTestHelper;

  beforeEach(() => {
    t = convexTest(schema, modules);
    gameHelper = new GameTestHelper(t);
  });

  describe("isGameWon()", () => {
    test("should return true when player has no tiles and bag is empty", async () => {
      // Arrange: Create game with 2 players
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      // Remove all tiles from current player's hand
      await t.run(async (ctx) => {
        const playerTiles = await ctx.db
          .query("tiles")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .collect();

        for (const tile of playerTiles) {
          await ctx.db.delete(tile._id);
        }
      });

      // Empty the bag
      await gameHelper.emptyTileBag(game._id);

      // Act: End turn (which calls isGameWon internally)
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game should have ended with winner
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(true);

      // Verify game is ended in database
      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ended");
      expect(updatedGame?.winner).toBe(player._id);
    });

    test("should return false when player has tiles even if bag is empty", async () => {
      // Arrange: Create game with 2 players
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      // Empty the bag but keep player tiles
      await gameHelper.emptyTileBag(game._id);

      // Verify player still has tiles
      const playerTiles = await gameHelper.getPlayerTiles(player._id);
      expect(playerTiles.length).toBeGreaterThan(0);

      // Act: End turn
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game should NOT have ended
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(false);

      // Verify game is still ongoing
      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ongoing");
      expect(updatedGame?.winner).toBeUndefined();
    });

    test("should return false when bag has tiles even if player has no tiles", async () => {
      // Arrange: Create game with 2 players
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      // Remove all tiles from current player's hand but keep bag full
      await t.run(async (ctx) => {
        const playerTiles = await ctx.db
          .query("tiles")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .collect();

        for (const tile of playerTiles) {
          await ctx.db.delete(tile._id);
        }
      });

      // Verify bag still has tiles
      const bagTiles = await t.run(async (ctx) => {
        return await ctx.db
          .query("tiles")
          .withIndex("by_game_location", (q) =>
            q.eq("gameId", game._id).eq("location", "in_bag"),
          )
          .collect();
      });
      expect(bagTiles.length).toBeGreaterThan(0);

      // Act: End turn
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game should NOT have ended (bag still has tiles)
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(false);

      // Verify game is still ongoing
      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ongoing");
      expect(updatedGame?.winner).toBeUndefined();
    });

    test("should return false when both player and bag have tiles", async () => {
      // Arrange: Create game with 2 players (standard setup)
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      // Verify both player and bag have tiles
      const playerTiles = await gameHelper.getPlayerTiles(player._id);
      const bagTiles = await t.run(async (ctx) => {
        return await ctx.db
          .query("tiles")
          .withIndex("by_game_location", (q) =>
            q.eq("gameId", game._id).eq("location", "in_bag"),
          )
          .collect();
      });
      expect(playerTiles.length).toBeGreaterThan(0);
      expect(bagTiles.length).toBeGreaterThan(0);

      // Act: End turn
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game should NOT have ended
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(false);

      // Verify game is still ongoing
      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ongoing");
      expect(updatedGame?.winner).toBeUndefined();
    });
  });

  describe("isGameIdle()", () => {
    test("should return false when no moves exist", async () => {
      // Arrange: Create game with 2 players
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { user } = await gameHelper.getCurrentPlayer(game._id);

      // Delete all moves (if any exist from game start)
      await t.run(async (ctx) => {
        const moves = await ctx.db
          .query("moves")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .collect();
        for (const move of moves) {
          await ctx.db.delete(move._id);
        }
      });

      // Act: End turn
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game should NOT be idle (no moves at all)
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(false);
    });

    test("should return false when last move is recent (within 2 rounds for each player)", async () => {
      // Arrange: Create game with 2 players
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { user } = await gameHelper.getCurrentPlayer(game._id);

      // Get a cell to reference in the move
      const cell = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .first();
      });

      // Get a tile to reference
      const tile = await t.run(async (ctx) => {
        return await ctx.db
          .query("tiles")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .first();
      });

      // Create a recent move (current turn)
      await t.run(async (ctx) => {
        await ctx.db.insert("moves", {
          gameId: game._id,
          type: "PLAYER_TO_CELL",
          turn: game.currentTurn,
          tileId: tile!._id,
          playerId: players[0]._id,
          cellId: cell!._id,
          moveScore: 0,
        });
      });

      // Act: End turn
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game should NOT be idle (recent move)
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(false);
    });

    test("should return true when last move is older than 2 rounds for 2 players", async () => {
      // Arrange: Create game with 2 players, each with the same tiles
      const { game, users } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [
          [1, 2, 3, 4, 5, 6, 7],
          [1, 2, 3, 4, 5, 6, 7],
        ],
      });

      // Turn 1: Player 1 plays a tile
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

      // Turn 2: Player 2 plays a tile
      ({ player, user } = await gameHelper.getCurrentPlayer(game._id));
      ({ tile, cell } = await gameHelper.findValidTileCellPair(game._id));

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

      // Now both players have played once
      // For 2 players, 2 rounds = 4 turns total
      // We need 4 more turns without any tile placements

      // Turn 3: Player 1 ends turn without playing (2nd round, turn 1)
      ({ user } = await gameHelper.getCurrentPlayer(game._id));
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Turn 4: Player 2 ends turn without playing (2nd round, turn 2)
      ({ user } = await gameHelper.getCurrentPlayer(game._id));
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Turn 5: Player 1 ends turn without playing (3rd round, turn 1)
      ({ user } = await gameHelper.getCurrentPlayer(game._id));
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Turn 6: Player 2 ends turn without playing (3rd round, turn 2)
      ({ user } = await gameHelper.getCurrentPlayer(game._id));
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Act: Turn 7: Player 1 tries to end turn - should detect idle
      // Last PLAYER_TO_CELL move was on turn 2
      // Current turn is 7
      // 7 - 2 = 5, which is > 4 (2 rounds * 2 players)
      ({ user } = await gameHelper.getCurrentPlayer(game._id));
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game should be idle
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(true);

      // Verify game ended as idle (no winner set currently - Phase 1 will add winner determination)
      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ended");
      expect(updatedGame?.winner).toBeUndefined();
    });

    test("should return true when last move is older than 2 rounds for 3 players", async () => {
      // Arrange: Create game with 3 players, each with the same tiles
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2", "Player 3"],
        playerTileValues: [
          [1, 2, 3, 4, 5, 6, 7],
          [1, 2, 3, 4, 5, 6, 7],
          [1, 2, 3, 4, 5, 6, 7],
        ],
      });

      // Round 1: Each player plays one tile
      for (let i = 0; i < 3; i++) {
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

      // For 3 players, 2 rounds = 6 turns total
      // We need 6 more turns without any tile placements (2 full rounds)

      // Round 2: All 3 players end turn without playing
      for (let i = 0; i < 3; i++) {
        const { user } = await gameHelper.getCurrentPlayer(game._id);
        await t.mutation(api.controllers.play.mutations.endTurn, {
          gameId: game._id,
          sessionId: user.sessionId as SessionId,
        });
      }

      // Round 3: All 3 players end turn without playing
      for (let i = 0; i < 3; i++) {
        const { user } = await gameHelper.getCurrentPlayer(game._id);
        await t.mutation(api.controllers.play.mutations.endTurn, {
          gameId: game._id,
          sessionId: user.sessionId as SessionId,
        });
      }

      // Act: Round 4, Turn 1: Should detect idle
      // Last PLAYER_TO_CELL move was on turn 3 (end of round 1)
      // Current turn is 10 (round 4, turn 1)
      // 10 - 3 = 7, which is > 6 (2 rounds * 3 players)
      const { user } = await gameHelper.getCurrentPlayer(game._id);
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game should be idle
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(true);

      // Verify game ended as idle
      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ended");
      expect(updatedGame?.winner).toBeUndefined();
    });

    test("should return true when last move is older than 2 rounds for 4 players", async () => {
      // Arrange: Create game with 4 players, each with the same tiles
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2", "Player 3", "Player 4"],
        playerTileValues: [
          [1, 2, 3, 4, 5, 6, 7],
          [1, 2, 3, 4, 5, 6, 7],
          [1, 2, 3, 4, 5, 6, 7],
          [1, 2, 3, 4, 5, 6, 7],
        ],
      });

      // Round 1: Each player plays one tile
      for (let i = 0; i < 4; i++) {
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

      // For 4 players, 2 rounds = 8 turns total
      // We need 8 more turns without any tile placements (2 full rounds)

      // Round 2: All 4 players end turn without playing
      for (let i = 0; i < 4; i++) {
        const { user } = await gameHelper.getCurrentPlayer(game._id);
        await t.mutation(api.controllers.play.mutations.endTurn, {
          gameId: game._id,
          sessionId: user.sessionId as SessionId,
        });
      }

      // Round 3: All 4 players end turn without playing
      for (let i = 0; i < 4; i++) {
        const { user } = await gameHelper.getCurrentPlayer(game._id);
        await t.mutation(api.controllers.play.mutations.endTurn, {
          gameId: game._id,
          sessionId: user.sessionId as SessionId,
        });
      }

      // Act: Round 4, Turn 1: Should detect idle
      // Last PLAYER_TO_CELL move was on turn 4 (end of round 1)
      // Current turn is 13 (round 4, turn 1)
      // 13 - 4 = 9, which is > 8 (2 rounds * 4 players)
      const { user } = await gameHelper.getCurrentPlayer(game._id);
      const result = await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game should be idle
      expect(result.status).toBe("success");
      expect(result.data?.gameEnded).toBe(true);

      // Verify game ended as idle
      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ended");
      expect(updatedGame?.winner).toBeUndefined();
    });
  });

  describe("endGameWithWinner()", () => {
    test("should set game status to ended", async () => {
      // Arrange: Create game and set up win condition
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      // Remove all tiles from player and empty bag
      await t.run(async (ctx) => {
        const playerTiles = await ctx.db
          .query("tiles")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .collect();

        for (const tile of playerTiles) {
          await ctx.db.delete(tile._id);
        }
      });
      await gameHelper.emptyTileBag(game._id);

      // Act: End turn (triggers endGameWithWinner)
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game status should be "ended"
      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ended");
    });

    test("should set winner id correctly", async () => {
      // Arrange: Create game and set up win condition
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      // Remove all tiles from player and empty bag
      await t.run(async (ctx) => {
        const playerTiles = await ctx.db
          .query("tiles")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .collect();

        for (const tile of playerTiles) {
          await ctx.db.delete(tile._id);
        }
      });
      await gameHelper.emptyTileBag(game._id);

      // Act: End turn (triggers endGameWithWinner)
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Winner should be the current player
      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.winner).toBe(player._id);
    });

    test("should save game to database", async () => {
      // Arrange: Create game and set up win condition
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      const gameBeforeEnd = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(gameBeforeEnd?.status).toBe("ongoing");
      expect(gameBeforeEnd?.winner).toBeUndefined();

      // Remove all tiles from player and empty bag
      await t.run(async (ctx) => {
        const playerTiles = await ctx.db
          .query("tiles")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .collect();

        for (const tile of playerTiles) {
          await ctx.db.delete(tile._id);
        }
      });
      await gameHelper.emptyTileBag(game._id);

      // Act: End turn (triggers endGameWithWinner)
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Changes should be persisted to database
      const gameAfterEnd = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(gameAfterEnd?.status).toBe("ended");
      expect(gameAfterEnd?.winner).toBe(player._id);
    });
  });

  describe("endGameAsIdle()", () => {
    test("should set game status to ended", async () => {
      // Arrange: Create game and set up idle condition
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { user } = await gameHelper.getCurrentPlayer(game._id);

      // Get references for the move
      const cell = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .first();
      });

      const tile = await t.run(async (ctx) => {
        return await ctx.db
          .query("tiles")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .first();
      });

      // Set up idle condition (old move)
      const currentTurn = 10;
      const oldMoveTurn = currentTurn - 5;

      await t.run(async (ctx) => {
        await ctx.db.patch(game._id, { currentTurn });
        await ctx.db.insert("moves", {
          gameId: game._id,
          type: "PLAYER_TO_CELL",
          turn: oldMoveTurn,
          tileId: tile!._id,
          playerId: players[0]._id,
          cellId: cell!._id,
          moveScore: 0,
        });
      });

      // Act: End turn (triggers endGameAsIdle)
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Game status should be "ended"
      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.status).toBe("ended");
    });

    test("should not set a winner", async () => {
      // Arrange: Create game and set up idle condition
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { user } = await gameHelper.getCurrentPlayer(game._id);

      // Get references for the move
      const cell = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .first();
      });

      const tile = await t.run(async (ctx) => {
        return await ctx.db
          .query("tiles")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .first();
      });

      // Set up idle condition
      const currentTurn = 10;
      const oldMoveTurn = currentTurn - 5;

      await t.run(async (ctx) => {
        await ctx.db.patch(game._id, { currentTurn });
        await ctx.db.insert("moves", {
          gameId: game._id,
          type: "PLAYER_TO_CELL",
          turn: oldMoveTurn,
          tileId: tile!._id,
          playerId: players[0]._id,
          cellId: cell!._id,
          moveScore: 0,
        });
      });

      // Act: End turn (triggers endGameAsIdle)
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Winner should not be set
      const updatedGame = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(updatedGame?.winner).toBeUndefined();
    });

    test("should save game to database", async () => {
      // Arrange: Create game and set up idle condition
      const { game, players } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      const { user } = await gameHelper.getCurrentPlayer(game._id);

      const gameBeforeEnd = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(gameBeforeEnd?.status).toBe("ongoing");

      // Get references for the move
      const cell = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .first();
      });

      const tile = await t.run(async (ctx) => {
        return await ctx.db
          .query("tiles")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .first();
      });

      // Set up idle condition
      const currentTurn = 10;
      const oldMoveTurn = currentTurn - 5;

      await t.run(async (ctx) => {
        await ctx.db.patch(game._id, { currentTurn });
        await ctx.db.insert("moves", {
          gameId: game._id,
          type: "PLAYER_TO_CELL",
          turn: oldMoveTurn,
          tileId: tile!._id,
          playerId: players[0]._id,
          cellId: cell!._id,
          moveScore: 0,
        });
      });

      // Act: End turn (triggers endGameAsIdle)
      await t.mutation(api.controllers.play.mutations.endTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Changes should be persisted to database
      const gameAfterEnd = await t.run(async (ctx) => {
        return await ctx.db.get(game._id);
      });

      expect(gameAfterEnd?.status).toBe("ended");
    });
  });
});
