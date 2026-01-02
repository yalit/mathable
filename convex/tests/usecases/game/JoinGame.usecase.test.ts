import { expect, test, describe, beforeEach } from "vitest";
import { api } from "../../../_generated/api";
import type { Id } from "../../../_generated/dataModel";
import schema from "../../../schema";
import { modules } from "../../../test.setup";
import { convexTest, type TestConvex } from "convex-test";
import type { SessionId } from "convex-helpers/server/sessions";

describe("JoinGameUseCase", () => {
  let t: TestConvex<typeof schema>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  test("should allow a player to join a waiting game", async () => {
    // Arrange: Create a game first
    const ownerSessionId = "owner-session" as SessionId;
    const joinerSessionId = "joiner-session" as SessionId;

    const createResult = await t.mutation(
      api.controllers.game.mutations.create,
      {
        playerName: "Game Owner",
        sessionId: ownerSessionId,
      },
    );

    expect(createResult.status).toBe("success");
    const gameToken = createResult.data!.gameToken;

    // Get the game ID
    const game = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", gameToken))
        .first();
    });

    expect(game).toBeDefined();

    // Act: Join the game with a different user
    const joinResult = await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 2",
      sessionId: joinerSessionId,
    });

    // Assert: Should successfully join
    expect(joinResult).toMatchObject({
      status: "success",
      data: {
        playerToken: expect.any(String),
      },
    });

    // Verify the player was created
    const player = await t.run(async (ctx) => {
      return await ctx.db
        .query("players")
        .withIndex("by_token", (q) =>
          q.eq("token", joinResult.data!.playerToken),
        )
        .first();
    });

    expect(player).toBeDefined();
    expect(player?.name).toBe("Player 2");
    expect(player?.gameId).toBe(game?._id);
    expect(player?.owner).toBe(false);
    expect(player?.current).toBe(false);
    expect(player?.score).toBe(0);

    // Verify there are now 2 players in the game
    const allPlayers = await t.run(async (ctx) => {
      return await ctx.db
        .query("players")
        .withIndex("by_game", (q) => q.eq("gameId", game?._id as Id<"games">))
        .collect();
    });

    expect(allPlayers.length).toBe(2);
  });

  test("should allow up to 4 players to join a game", async () => {
    // Arrange: Create a game
    const ownerSessionId = "owner-session" as SessionId;

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

    // Act: Add 3 more players (for a total of 4)
    const player2 = await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 2",
      sessionId: "session-2" as SessionId,
    });

    const player3 = await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 3",
      sessionId: "session-3" as SessionId,
    });

    const player4 = await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 4",
      sessionId: "session-4" as SessionId,
    });

    // Assert: All joins should succeed
    expect(player2.status).toBe("success");
    expect(player3.status).toBe("success");
    expect(player4.status).toBe("success");

    // Verify there are exactly 4 players
    const allPlayers = await t.run(async (ctx) => {
      return await ctx.db
        .query("players")
        .withIndex("by_game", (q) => q.eq("gameId", game?._id as Id<"games">))
        .collect();
    });

    expect(allPlayers.length).toBe(4);
  });

  test("should fail when trying to join a full game", async () => {
    // Arrange: Create a game with 4 players
    const ownerSessionId = "owner-session" as SessionId;

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

    // Add 3 more players to fill the game
    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 2",
      sessionId: "session-2" as SessionId,
    });

    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 3",
      sessionId: "session-3" as SessionId,
    });

    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 4",
      sessionId: "session-4" as SessionId,
    });

    // Act: Try to add a 5th player
    const result = await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 5",
      sessionId: "session-5" as SessionId,
    });

    // Assert: Should fail
    expect(result).toMatchObject({
      status: "error",
      data: expect.stringContaining("maximum 4 players"),
    });
  });

  test("should fail when trying to join a game that has started", async () => {
    // Arrange: Create a game and start it
    const ownerSessionId = "owner-session" as SessionId;

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
      sessionId: "session-2" as SessionId,
    });

    // Start the game
    await t.mutation(api.controllers.game.mutations.start, {
      gameId: game!._id,
      sessionId: ownerSessionId,
    });

    // Act: Try to join after the game has started
    const result = await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Late Player",
      sessionId: "late-session" as SessionId,
    });

    // Assert: Should fail
    expect(result.status).toBe("error");
    expect(result.data).toBeDefined();
  });

  test("should assign correct player order when joining", async () => {
    // Arrange: Create a game
    const ownerSessionId = "owner-session" as SessionId;

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

    // Act: Add 3 more players
    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 2",
      sessionId: "session-2" as SessionId,
    });

    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 3",
      sessionId: "session-3" as SessionId,
    });

    await t.mutation(api.controllers.game.mutations.join, {
      gameId: game!._id,
      playerName: "Player 4",
      sessionId: "session-4" as SessionId,
    });

    // Assert: Verify player orders
    const players = await t.run(async (ctx) => {
      return await ctx.db
        .query("players")
        .withIndex("by_game_order", (q) =>
          q.eq("gameId", game?._id as Id<"games">),
        )
        .collect();
    });

    // Players should be ordered 0, 1, 2, 3
    expect(players.length).toBe(4);

    // Sort by order to verify
    const sortedPlayers = players.sort((a, b) => a.order - b.order);
    expect(sortedPlayers[0].order).toBe(0);
    expect(sortedPlayers[1].order).toBe(1);
    expect(sortedPlayers[2].order).toBe(2);
    expect(sortedPlayers[3].order).toBe(3);

    // First player (order 0) should be the owner
    expect(sortedPlayers[0].owner).toBe(true);
    expect(sortedPlayers[0].name).toBe("Game Owner");
  });
});
