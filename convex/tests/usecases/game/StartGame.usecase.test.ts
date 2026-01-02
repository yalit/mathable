import { expect, test, describe, beforeEach } from "vitest";
import { api } from "../../../_generated/api";
import type { Id } from "../../../_generated/dataModel";
import schema from "../../../schema";
import { modules } from "../../../test.setup";
import { convexTest, type TestConvex } from "convex-test";

describe("StartGameUseCase", () => {
  let t: TestConvex<typeof schema>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  test("should start a game with 2 players", async () => {
    // Arrange: Create a game with 2 players
    const ownerSessionId = "owner-session" as any;
    const player2SessionId = "player2-session" as any;

    const createResult = await t.mutation(
      api.controllers.game.mutations.create,
      {
        playerName: "Game Owner",
        sessionId: ownerSessionId,
      },
    );

    const gameToken = createResult.data!.gameToken;

    const game = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", gameToken))
        .first();
    });

    // Add a second player
    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 2",
      sessionId: player2SessionId,
    });

    // Act: Start the game
    const startResult = await t.mutation(api.controllers.game.mutations.start, {
      gameId: game!._id,
      sessionId: ownerSessionId,
    });

    // Assert: Should successfully start
    expect(startResult).toMatchObject({
      status: "success",
      data: null,
    });

    // Verify game status changed to in_progress
    const updatedGame = await t.run(async (ctx) => {
      return await ctx.db.get(game!._id);
    });

    expect(updatedGame?.status).toBe("ongoing");

    // Verify one player is marked as current
    const players = await t.run(async (ctx) => {
      return await ctx.db
        .query("players")
        .withIndex("by_game", (q) => q.eq("gameId", game!._id))
        .collect();
    });

    const currentPlayers = players.filter((p) => p.current);
    expect(currentPlayers.length).toBe(1);

    // After starting, one player should be current (order is randomized and starts from 1)
    const currentPlayer = players.find((p) => p.current);
    expect(currentPlayer).toBeDefined();
    expect(currentPlayer?.order).toBeGreaterThanOrEqual(1);
    expect(currentPlayer?.order).toBeLessThanOrEqual(players.length);

    // Verify players received initial tiles (7 each)
    const tilesPlayer1 = await t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_player", (q) => q.eq("playerId", players[0]._id))
        .collect();
    });

    const tilesPlayer2 = await t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_player", (q) => q.eq("playerId", players[1]._id))
        .collect();
    });

    expect(tilesPlayer1.length).toBe(7);
    expect(tilesPlayer2.length).toBe(7);

    // Verify tiles are in player's hand
    expect(tilesPlayer1.every((t) => t.location === "in_hand")).toBe(true);
    expect(tilesPlayer2.every((t) => t.location === "in_hand")).toBe(true);
  });

  test("should start a game with 4 players", async () => {
    // Arrange: Create a game with 4 players
    const ownerSessionId = "owner-session" as any;

    const createResult = await t.mutation(
      api.controllers.game.mutations.create,
      {
        playerName: "Player 1",
        sessionId: ownerSessionId,
      },
    );

    const gameToken = createResult.data!.gameToken;

    const game = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", gameToken))
        .first();
    });

    // Add 3 more players
    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 2",
      sessionId: "session-2" as any,
    });

    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 3",
      sessionId: "session-3" as any,
    });

    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 4",
      sessionId: "session-4" as any,
    });

    // Act: Start the game
    const startResult = await t.mutation(api.controllers.game.mutations.start, {
      gameId: game!._id,
      sessionId: ownerSessionId,
    });

    // Assert: Should successfully start
    expect(startResult.status).toBe("success");

    // Verify all 4 players received tiles
    const players = await t.run(async (ctx) => {
      return await ctx.db
        .query("players")
        .withIndex("by_game", (q) => q.eq("gameId", game!._id))
        .collect();
    });

    expect(players.length).toBe(4);

    for (const player of players) {
      const playerTiles = await t.run(async (ctx) => {
        return await ctx.db
          .query("tiles")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .collect();
      });

      expect(playerTiles.length).toBe(7);
    }
  });

  test("should fail when trying to start with only 1 player", async () => {
    // Arrange: Create a game with only the owner
    const ownerSessionId = "owner-session" as any;

    const createResult = await t.mutation(
      api.controllers.game.mutations.create,
      {
        playerName: "Game Owner",
        sessionId: ownerSessionId,
      },
    );

    const gameToken = createResult.data!.gameToken;

    const game = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", gameToken))
        .first();
    });

    // Act: Try to start the game with only 1 player
    const startResult = await t.mutation(api.controllers.game.mutations.start, {
      gameId: game!._id,
      sessionId: ownerSessionId,
    });

    // Assert: Should fail
    expect(startResult).toMatchObject({
      status: "error",
      data: expect.stringContaining("at least 2 players"),
    });

    // Verify game status is still waiting
    const updatedGame = await t.run(async (ctx) => {
      return await ctx.db.get(game!._id);
    });

    expect(updatedGame?.status).toBe("waiting");
  });

  test("should fail when non-owner tries to start the game", async () => {
    // Arrange: Create a game with 2 players
    const ownerSessionId = "owner-session" as any;
    const player2SessionId = "player2-session" as any;

    const createResult = await t.mutation(
      api.controllers.game.mutations.create,
      {
        playerName: "Game Owner",
        sessionId: ownerSessionId,
      },
    );

    const gameToken = createResult.data!.gameToken;

    const game = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", gameToken))
        .first();
    });

    // Add a second player
    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 2",
      sessionId: player2SessionId,
    });

    // Act: Try to start the game as the second player (not owner)
    const startResult = await t.mutation(api.controllers.game.mutations.start, {
      gameId: game!._id,
      sessionId: player2SessionId,
    });

    // Assert: Should fail
    expect(startResult).toMatchObject({
      status: "error",
      data: expect.stringContaining("Only the game owner"),
    });

    // Verify game status is still waiting
    const updatedGame = await t.run(async (ctx) => {
      return await ctx.db.get(game!._id);
    });

    expect(updatedGame?.status).toBe("waiting");
  });

  test("should fail when trying to start an already started game", async () => {
    // Arrange: Create and start a game
    const ownerSessionId = "owner-session" as any;

    const createResult = await t.mutation(
      api.controllers.game.mutations.create,
      {
        playerName: "Game Owner",
        sessionId: ownerSessionId,
      },
    );

    const gameToken = createResult.data!.gameToken;

    const game = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", gameToken))
        .first();
    });

    // Add a second player
    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 2",
      sessionId: "player2-session" as any,
    });

    // Start the game
    await t.mutation(api.controllers.game.mutations.start, {
      gameId: game!._id,
      sessionId: ownerSessionId,
    });

    // Act: Try to start the game again
    const secondStartResult = await t.mutation(
      api.controllers.game.mutations.start,
      {
        gameId: game!._id,
        sessionId: ownerSessionId,
      },
    );

    // Assert: Should fail
    expect(secondStartResult).toMatchObject({
      status: "error",
      data: expect.stringContaining("cannot be started"),
    });
  });

  test("should correctly set first player as current and assign orders", async () => {
    // Arrange: Create a game with 3 players
    const ownerSessionId = "owner-session" as any;

    const createResult = await t.mutation(
      api.controllers.game.mutations.create,
      {
        playerName: "Player 1",
        sessionId: ownerSessionId,
      },
    );

    const gameToken = createResult.data!.gameToken;

    const game = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", gameToken))
        .first();
    });

    // Add 2 more players
    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 2",
      sessionId: "session-2" as any,
    });

    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 3",
      sessionId: "session-3" as any,
    });

    // Act: Start the game
    await t.mutation(api.controllers.game.mutations.start, {
      gameId: game!._id,
      sessionId: ownerSessionId,
    });

    // Assert: Verify correct player is current
    const players = await t.run(async (ctx) => {
      return await ctx.db
        .query("players")
        .withIndex("by_game", (q) => q.eq("gameId", game!._id))
        .collect();
    });

    // Sort by order to verify
    const sortedPlayers = players.sort((a, b) => a.order - b.order);

    expect(sortedPlayers.length).toBe(3);

    // Player orders should be 1, 2, 3 (randomized, but starting from 1)
    expect(sortedPlayers[0].order).toBe(1);
    expect(sortedPlayers[1].order).toBe(2);
    expect(sortedPlayers[2].order).toBe(3);

    // Only the first player (order 1) should be current
    expect(sortedPlayers[0].current).toBe(true);
    expect(sortedPlayers[1].current).toBe(false);
    expect(sortedPlayers[2].current).toBe(false);
  });

  test("should decrease tile count in bag after distributing to players", async () => {
    // Arrange: Create a game with 2 players
    const ownerSessionId = "owner-session" as any;

    const createResult = await t.mutation(
      api.controllers.game.mutations.create,
      {
        playerName: "Player 1",
        sessionId: ownerSessionId,
      },
    );

    const gameToken = createResult.data!.gameToken;

    const game = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", gameToken))
        .first();
    });

    // Add a second player
    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 2",
      sessionId: "session-2" as any,
    });

    // Count tiles in bag before starting
    const tilesInBagBefore = await t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_game_location", (q) =>
          q.eq("gameId", game!._id).eq("location", "in_bag"),
        )
        .collect();
    });

    const bagCountBefore = tilesInBagBefore.length;

    // Act: Start the game
    await t.mutation(api.controllers.game.mutations.start, {
      gameId: game!._id,
      sessionId: ownerSessionId,
    });

    // Assert: Verify bag count decreased by 14 (7 tiles × 2 players)
    const tilesInBagAfter = await t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_game_location", (q) =>
          q.eq("gameId", game!._id).eq("location", "in_bag"),
        )
        .collect();
    });

    const bagCountAfter = tilesInBagAfter.length;

    expect(bagCountBefore - bagCountAfter).toBe(14); // 7 tiles per player × 2 players

    // Verify tiles in players' hands
    const tilesInHand = await t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_game_location", (q) =>
          q.eq("gameId", game!._id).eq("location", "in_hand"),
        )
        .collect();
    });

    expect(tilesInHand.length).toBe(14);
  });
});
