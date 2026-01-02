import { expect, test, describe, beforeEach } from "vitest";
import { api } from "../../../_generated/api";
import type { Id } from "../../../_generated/dataModel";
import schema from "../../../schema";
import { modules } from "../../../test.setup";
import { convexTest, type TestConvex } from "convex-test";
import { GameTestHelper } from "../GameTest.helper";
import type { SessionId } from "convex-helpers/server/sessions";

describe("PickTileUseCase", () => {
  let t: TestConvex<typeof schema>;
  let gameHelper: GameTestHelper;

  beforeEach(() => {
    t = convexTest(schema, modules);
    gameHelper = new GameTestHelper(t);
  });

  test("should pick a tile from bag and add to player's hand", async () => {
    // Arrange: Create and start a game
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    const { player, user } = await gameHelper.getCurrentPlayer(game._id);

    // Count tiles in hand before
    const tilesInHandBefore = await gameHelper.getPlayerTiles(player._id);

    // Count tiles in bag before
    const tilesInBagBefore = await t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_game_location", (q) =>
          q.eq("gameId", game._id).eq("location", "in_bag"),
        )
        .collect();
    });

    // Act: Pick a tile
    const result = await t.mutation(api.controllers.tile.mutations.pick, {
      playerId: player._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Tile picked successfully
    expect(result).toMatchObject({
      status: "success",
      data: {
        tileId: expect.any(String),
      },
    });

    const pickedTileId = result.data!.tileId as Id<"tiles">;

    // Verify tile is in player's hand
    const pickedTile = await t.run(async (ctx) => {
      return await ctx.db.get(pickedTileId);
    });

    expect(pickedTile?.location).toBe("in_hand");
    expect(pickedTile?.playerId).toBe(player._id);

    // Verify player's hand increased by 1
    const tilesInHandAfter = await gameHelper.getPlayerTiles(player._id);
    expect(tilesInHandAfter.length).toBe(tilesInHandBefore.length + 1);

    // Verify bag decreased by 1
    const tilesInBagAfter = await t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_game_location", (q) =>
          q.eq("gameId", game._id).eq("location", "in_bag"),
        )
        .collect();
    });

    expect(tilesInBagAfter.length).toBe(tilesInBagBefore.length - 1);
  });

  test("should record BAG_TO_PLAYER move", async () => {
    // Arrange: Create and start a game
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    const { player, user } = await gameHelper.getCurrentPlayer(game._id);

    // Act: Pick a tile
    const result = await t.mutation(api.controllers.tile.mutations.pick, {
      playerId: player._id,
      sessionId: user.sessionId as SessionId,
    });

    const pickedTileId = result.data!.tileId as Id<"tiles">;

    // Assert: BAG_TO_PLAYER move was recorded
    const moves = await t.run(async (ctx) => {
      return await ctx.db
        .query("moves")
        .withIndex("by_turn", (q) => q.eq("gameId", game._id))
        .collect();
    });

    expect(moves.length).toBe(1);
    expect(moves[0].type).toBe("BAG_TO_PLAYER");
    expect(moves[0].tileId).toBe(pickedTileId);
    expect(moves[0].playerId).toBe(player._id);
  });

  test("should fail when bag is empty", async () => {
    // Arrange: Create and start a game
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    // Empty the bag
    await gameHelper.emptyTileBag(game._id);

    const { player, user } = await gameHelper.getCurrentPlayer(game._id);

    // Act: Try to pick a tile from empty bag
    const result = await t.mutation(api.controllers.tile.mutations.pick, {
      playerId: player._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Should fail
    expect(result).toMatchObject({
      status: "error",
      data: expect.stringContaining("No tiles left"),
    });
  });

  test("should fail when non-current player tries to pick tile", async () => {
    // Arrange: Create and start a game
    const { players, users } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    // Get non-current player
    const nonCurrentPlayer = players.find((p) => !p.current)!;
    const nonCurrentPlayerIndex = players.indexOf(nonCurrentPlayer);
    const user = users[nonCurrentPlayerIndex];

    // Act: Try to pick tile as non-current player
    const result = await t.mutation(api.controllers.tile.mutations.pick, {
      playerId: nonCurrentPlayer._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Should fail
    expect(result).toMatchObject({
      status: "error",
      data: expect.stringContaining("not your turn"),
    });
  });

  test("should pick random tiles (different tiles over multiple picks)", async () => {
    // Arrange: Create and start a game
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    const { player, user } = await gameHelper.getCurrentPlayer(game._id);

    const pickedTileIds: Id<"tiles">[] = [];

    // Act: Pick 5 tiles
    for (let i = 0; i < 5; i++) {
      const result = await t.mutation(api.controllers.tile.mutations.pick, {
        playerId: player._id,
        sessionId: user.sessionId as SessionId,
      });

      pickedTileIds.push(result.data!.tileId as Id<"tiles">);
    }

    // Assert: All picked tiles are different
    const uniqueTileIds = new Set(pickedTileIds);
    expect(uniqueTileIds.size).toBe(5);
  });

  test("should fail when player tries to pick tile for another player", async () => {
    // Arrange: Create and start a game
    const { game, players } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    // Get both players
    const otherPlayer = players.find((p) => !p.current)!;

    const { user } = await gameHelper.getCurrentPlayer(game._id);

    // Act: Try to pick tile for the other player
    const result = await t.mutation(api.controllers.tile.mutations.pick, {
      playerId: otherPlayer._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Should fail
    expect(result).toMatchObject({
      status: "error",
      data: expect.stringContaining("for yourself"),
    });
  });

  test("should increase player hand size beyond 7 tiles", async () => {
    // Arrange: Create and start a game
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    const { player, user } = await gameHelper.getCurrentPlayer(game._id);

    // Verify player starts with 7 tiles
    const tilesInitial = await gameHelper.getPlayerTiles(player._id);
    expect(tilesInitial.length).toBe(7);

    // Act: Pick 2 additional tiles
    await t.mutation(api.controllers.tile.mutations.pick, {
      playerId: player._id,
      sessionId: user.sessionId as SessionId,
    });

    await t.mutation(api.controllers.tile.mutations.pick, {
      playerId: player._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Player now has 9 tiles
    const tilesAfter = await gameHelper.getPlayerTiles(player._id);
    expect(tilesAfter.length).toBe(9);
  });
});
