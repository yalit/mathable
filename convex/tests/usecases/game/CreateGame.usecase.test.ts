import { expect, test, describe, beforeEach } from "vitest";
import { api } from "../../../_generated/api";
import type { Id } from "../../../_generated/dataModel";
import schema from "../../../schema";
import { modules } from "../../../test.setup";
import { convexTest, type TestConvex } from "convex-test";

describe("CreateGameUseCase", () => {
  let t: TestConvex<typeof schema>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  test("should create a new game with owner player", async () => {
    // Arrange: Create a user session
    const sessionId = "test-session-123" as any;
    const playerName = "Test Player";

    // Act: Create a game
    const result = await t.mutation(api.controllers.game.mutations.create, {
      playerName,
      sessionId,
    });

    // Assert: Check result structure
    expect(result).toMatchObject({
      status: "success",
      data: {
        gameToken: expect.any(String),
        playerToken: expect.any(String),
      },
    });

    const { gameToken, playerToken } = result.data!;

    // Assert: Verify game was created
    const game = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", gameToken))
        .first();
    });

    expect(game).toBeDefined();
    expect(game?.status).toBe("waiting");
    expect(game?.currentTurn).toBe(0);
    expect(game).not.toBeNull();

    // Assert: Verify player was created
    const player = await t.run(async (ctx) => {
      return await ctx.db
        .query("players")
        .withIndex("by_token", (q) => q.eq("token", playerToken))
        .first();
    });

    expect(player).toBeDefined();
    expect(player?.name).toBe(playerName);
    expect(player?.owner).toBe(true);
    expect(player?.current).toBe(false);
    expect(player?.score).toBe(0);
    expect(player?.gameId).toBe(game?._id);

    // Assert: Verify cells were created (14x14 = 196)
    const cells = await t.run(async (ctx) => {
      return await ctx.db
        .query("cells")
        .withIndex("by_game_row_column", (q) =>
          q.eq("gameId", game?._id as Id<"games">),
        )
        .collect();
    });

    expect(cells.length).eq(196);

    // Assert: Verify tiles were created
    const tiles = await t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_game", (q) => q.eq("gameId", game?._id as Id<"games">))
        .collect();
    });

    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.every((tile) => tile.location === "in_bag")).toBe(true);
    expect(tiles.every((tile) => tile.playerId === null)).toBe(true);
    expect(tiles.every((tile) => tile.cellId === null)).toBe(true);

    // Assert: Verify cells have computed allowed values
    const cellsWithAllowedValues = cells.filter(
      (cell) => cell.allowedValues.length > 0,
    );
    expect(cellsWithAllowedValues.length).toBeGreaterThan(0);
  });

  test("should create multiple games independently", async () => {
    // Arrange: Create two users
    const sessionId1 = "session-1" as any;
    const sessionId2 = "session-2" as any;

    await t.run(async (ctx) => {
      await ctx.db.insert("users", { sessionId: sessionId1 });
      await ctx.db.insert("users", { sessionId: sessionId2 });
    });

    // Act: Create two games
    const result1 = await t.mutation(api.controllers.game.mutations.create, {
      playerName: "Player 1",
      sessionId: sessionId1,
    });

    const result2 = await t.mutation(api.controllers.game.mutations.create, {
      playerName: "Player 2",
      sessionId: sessionId2,
    });

    // Assert: Both games should be created with unique tokens
    expect(result1.data?.gameToken).not.toBe(result2.data?.gameToken);
    expect(result1.data?.playerToken).not.toBe(result2.data?.playerToken);

    // Assert: Each game should have its own cells and tiles
    const game1 = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", result1.data!.gameToken))
        .first();
    });

    const game2 = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", result2.data!.gameToken))
        .first();
    });

    const cells1 = await t.run(async (ctx) => {
      return await ctx.db
        .query("cells")
        .withIndex("by_game_row_column")
        .filter((q) => q.eq(q.field("gameId"), game1?._id as Id<"games">))
        .collect();
    });

    const cells2 = await t.run(async (ctx) => {
      return await ctx.db
        .query("cells")
        .withIndex("by_game_row_column")
        .filter((q) => q.eq(q.field("gameId"), game2?._id as Id<"games">))
        .collect();
    });

    expect(cells1.length).toBeGreaterThan(0);
    expect(cells2.length).toBeGreaterThan(0);
    expect(cells1.every((c) => c.gameId === game1?._id)).toBe(true);
    expect(cells2.every((c) => c.gameId === game2?._id)).toBe(true);
  });

  test("should assign correct cell types (empty, value, multiplier, operator)", async () => {
    // Arrange: Create a user
    const sessionId = "test-session" as any;
    await t.run(async (ctx) => {
      await ctx.db.insert("users", { sessionId });
    });

    // Act: Create a game
    const result = await t.mutation(api.controllers.game.mutations.create, {
      playerName: "Test Player",
      sessionId,
    });

    const { gameToken } = result.data!;

    const game = await t.run(async (ctx) => {
      return await ctx.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", gameToken))
        .first();
    });

    // Assert: Verify different cell types exist
    const cells = await t.run(async (ctx) => {
      return await ctx.db
        .query("cells")
        .withIndex("by_game_row_column")
        .filter((q) => q.eq(q.field("gameId"), game?._id as Id<"games">))
        .collect();
    });

    const emptyCells = cells.filter((c) => c.type === "empty");
    const valueCells = cells.filter((c) => c.type === "value");
    const multiplierCells = cells.filter((c) => c.type === "multiplier");
    const operatorCells = cells.filter((c) => c.type === "operator");

    expect(emptyCells.length).eq(196 - 4 - 32 - 28);
    expect(valueCells.length).eq(4);
    expect(operatorCells.length).eq(32);
    expect(multiplierCells.length).eq(28);

    // Verify value cells have values
    expect(valueCells.every((c) => c.value !== null)).toBe(true);

    // Verify operator cells have operators
    expect(operatorCells.every((c) => c.operator !== null)).toBe(true);
    expect(
      operatorCells.every((c) => ["+", "-", "*", "/"].includes(c.operator!)),
    ).toBe(true);

    // Verify multiplier cells have multipliers (if any exist)
    if (multiplierCells.length > 0) {
      expect(multiplierCells.every((c) => c.multiplier !== null)).toBe(true);
    }
  });
});
