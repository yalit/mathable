import { expect, test, describe, beforeEach } from "vitest";
import { api } from "../../../_generated/api";
import schema from "../../../schema";
import { modules } from "../../../test.setup";
import { convexTest, type TestConvex } from "convex-test";
import { GameTestHelper } from "../GameTest.helper";
import type { SessionId } from "convex-helpers/server/sessions";

describe("PlaceTileUseCase", () => {
  let t: TestConvex<typeof schema>;
  let gameHelper: GameTestHelper;

  beforeEach(() => {
    t = convexTest(schema, modules);
    gameHelper = new GameTestHelper(t);
  });

  test("should successfully place a tile on an empty cell", async () => {
    // Arrange: Create and start a game with known tiles
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
      playerTileValues: [
        [1, 2, 3],
        [4, 5],
      ],
    });

    const { tile, cell, player, user } = await gameHelper.findValidTileCellPair(
      game._id,
    );

    // Act: Place tile on cell
    const result = await t.mutation(api.controllers.tile.mutations.playToCell, {
      tileId: tile._id,
      cellId: cell._id,
      playerId: player._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Tile placed successfully
    expect(result.status).toBe("success");

    // Verify tile is now on board
    const updatedTile = await t.run(async (ctx) => {
      return await ctx.db.get(tile._id);
    });

    expect(updatedTile?.location).toBe("on_board");
    expect(updatedTile?.cellId).toBe(cell._id);
    expect(updatedTile?.playerId).toBeNull();

    // Verify cell now has the tile
    const updatedCell = await t.run(async (ctx) => {
      return await ctx.db.get(cell._id);
    });

    expect(updatedCell?.tileId).toBe(tile._id);

    // Verify move was recorded
    const moves = await t.run(async (ctx) => {
      return await ctx.db
        .query("moves")
        .withIndex("by_turn", (q) => q.eq("gameId", game._id))
        .collect();
    });

    expect(moves.length).toBe(1);
    expect(moves[0].type).toBe("PLAYER_TO_CELL");
    expect(moves[0].tileId).toBe(tile._id);
    expect(moves[0].cellId).toBe(cell._id);
  });

  test("should fail when placing tile not in player's hand", async () => {
    // Arrange: Create and start a game
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
      playerTileValues: [[1], [2]],
    });

    const { cell, player, user } = await gameHelper.findValidTileCellPair(
      game._id,
    );

    // Get a tile from the bag (not in hand)
    const tileInBag = await t.run(async (ctx) => {
      return await ctx.db
        .query("tiles")
        .withIndex("by_game_location", (q) =>
          q.eq("gameId", game._id).eq("location", "in_bag"),
        )
        .first();
    });

    // Act: Try to place tile from bag
    const result = await t.mutation(api.controllers.tile.mutations.playToCell, {
      tileId: tileInBag!._id,
      cellId: cell._id,
      playerId: player._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Should fail
    expect(result).toMatchObject({
      status: "error",
      data: expect.stringContaining("Tile must be in your hand"),
    });
  });

  test("should fail when placing on occupied cell", async () => {
    // Arrange: Create and start a game with known tiles
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
      playerTileValues: [[1, 2], [3]],
    });

    const {
      tile: tile1,
      cell,
      player,
      user,
    } = await gameHelper.findValidTileCellPair(game._id);

    // Place first tile
    await t.mutation(api.controllers.tile.mutations.playToCell, {
      tileId: tile1._id,
      cellId: cell._id,
      playerId: player._id,
      sessionId: user.sessionId as SessionId,
    });

    // Get another tile from player's hand
    const playerTiles = await gameHelper.getPlayerTiles(player._id);
    const tile2 = playerTiles[0];

    // Act: Try to place second tile on same cell
    const result = await t.mutation(api.controllers.tile.mutations.playToCell, {
      tileId: tile2._id,
      cellId: cell._id,
      sessionId: user.sessionId as SessionId,
      playerId: player._id,
    });

    // Assert: Should fail
    expect(result.status).toBe("error");
  });

  test("should fail when non-current player tries to place tile", async () => {
    // Arrange: Create and start a game
    const { game, players, users } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    // Get non-current player
    const nonCurrentPlayer = players.find((p) => !p.current)!;
    const nonCurrentPlayerIndex = players.indexOf(nonCurrentPlayer);
    const user = users[nonCurrentPlayerIndex];

    const tiles = await gameHelper.getPlayerTiles(nonCurrentPlayer._id);
    const tile = tiles[0];

    const emptyCells = await gameHelper.getEmptyCellsWithAllowedValues(
      game._id,
    );
    const emptyCell = emptyCells[0].cell;

    // Act: Try to place tile when it's not their turn
    const result = await t.mutation(api.controllers.tile.mutations.playToCell, {
      tileId: tile._id,
      cellId: emptyCell._id,
      sessionId: user.sessionId as SessionId,
      playerId: nonCurrentPlayer._id,
    });

    // Assert: Should fail
    expect(result).toMatchObject({
      status: "error",
      data: expect.stringContaining("not your turn"),
    });
  });

  test("should record move with score", async () => {
    // Arrange: Create and start a game with known tiles
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
      playerTileValues: [[1, 2], [3]],
    });

    const { tile, cell, player, user } = await gameHelper.findValidTileCellPair(
      game._id,
    );

    // Act: Place tile
    await t.mutation(api.controllers.tile.mutations.playToCell, {
      tileId: tile._id,
      cellId: cell._id,
      sessionId: user.sessionId as SessionId,
      playerId: player._id,
    });

    // Assert: Move was recorded with score
    const moves = await t.run(async (ctx) => {
      return await ctx.db
        .query("moves")
        .withIndex("by_turn", (q) => q.eq("gameId", game._id).eq("turn", 1))
        .collect();
    });

    expect(moves.length).toBe(1);
    expect(moves[0].moveScore).toBe(tile.value);
  });

  test("should allow multiple tiles to be placed in same turn", async () => {
    // Arrange: Create and start a game with known tiles
    const { game } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
      playerTileValues: [[1, 2, 3], [4]],
    });

    // Act: Place 3 tiles
    for (let i = 0; i < 3; i++) {
      const { tile, cell, player, user } =
        await gameHelper.findValidTileCellPair(game._id);

      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile._id,
        cellId: cell._id,
        sessionId: user.sessionId as SessionId,
        playerId: player._id,
      });
    }

    // Assert: 3 moves recorded
    const moves = await t.run(async (ctx) => {
      return await ctx.db
        .query("moves")
        .withIndex("by_turn", (q) => q.eq("gameId", game._id))
        .collect();
    });

    expect(moves.length).toBe(3);
  });

  test("should fail when placing other player's tile", async () => {
    // Arrange: Create and start a game
    const { game, players } = await gameHelper.createGame({
      playerNames: ["Player 1", "Player 2"],
    });

    // Get current player and other player
    const currentPlayer = players.find((p) => p.current)!;
    const otherPlayer = players.find((p) => !p.current)!;

    const { user } = await gameHelper.getCurrentPlayer(game._id);

    // Get a tile from the other player
    const otherPlayerTiles = await gameHelper.getPlayerTiles(otherPlayer._id);
    const otherPlayerTile = otherPlayerTiles[0];

    const emptyCells = await gameHelper.getEmptyCellsWithAllowedValues(
      game._id,
    );
    const emptyCell = emptyCells[0].cell;

    // Act: Try to place other player's tile
    const result = await t.mutation(api.controllers.tile.mutations.playToCell, {
      tileId: otherPlayerTile._id,
      cellId: emptyCell._id,
      sessionId: user.sessionId as SessionId,
      playerId: currentPlayer._id,
    });

    // Assert: Should fail
    expect(result).toMatchObject({
      status: "error",
      data: expect.stringContaining("Tile must be in your hand"),
    });
  });
});
