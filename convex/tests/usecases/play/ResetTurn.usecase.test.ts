import { expect, test, describe, beforeEach } from "vitest";
import { api } from "../../../_generated/api";
import type { Id } from "../../../_generated/dataModel";
import schema from "../../../schema";
import { modules } from "../../../test.setup";
import { convexTest, type TestConvex } from "convex-test";
import type { SessionId } from "convex-helpers/server/sessions";
import { GameTestHelper } from "@cvx/tests/GameTest.helper";

describe("ResetTurnUseCase", () => {
  let t: TestConvex<typeof schema>;
  let gameHelper: GameTestHelper;

  beforeEach(() => {
    t = convexTest(schema, modules);
    gameHelper = new GameTestHelper(t);
  });

  test("should reset turn with no moves", async () => {
    const { game } = await gameHelper.createGame({
      playerNames: ["owner", "player_2"],
    });

    const { user } = await gameHelper.getCurrentPlayer(game._id);

    // Act: Reset turn with no moves
    const result = await t.mutation(api.controllers.play.mutations.resetTurn, {
      gameId: game._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Should return 0 moves reset
    expect(result).toMatchObject({
      status: "success",
      data: {
        movesReset: 0,
      },
    });
  });

  test("should reset a single tile placement", async () => {
    const { game } = await gameHelper.createGame({
      playerNames: ["owner", "player_2"],
      playerTileValues: [[1], [2]],
    });

    const { player, user } = await gameHelper.getCurrentPlayer(game._id);
    const { tile, cell } = await gameHelper.findValidTileCellPair(game._id);

    await t.mutation(api.controllers.tile.mutations.playToCell, {
      tileId: tile._id,
      cellId: cell._id,
      sessionId: user!.sessionId as SessionId,
      playerId: player._id,
    });

    // Verify tile is on board
    const tileAfterPlace = await t.run(async (ctx) => {
      return await ctx.db.get(tile._id);
    });
    expect(tileAfterPlace?.location).toBe("on_board");

    // Act: Reset turn
    const result = await t.mutation(api.controllers.play.mutations.resetTurn, {
      gameId: game._id,
      sessionId: user!.sessionId as SessionId,
    });

    // Assert: 1 move was reset
    expect(result).toMatchObject({
      status: "success",
      data: {
        movesReset: 1,
      },
    });

    // Verify tile is back in hand
    const tileAfterReset = await t.run(async (ctx) => {
      return await ctx.db.get(tile._id);
    });
    expect(tileAfterReset?.location).toBe("in_hand");
    expect(tileAfterReset?.playerId).toBe(player!._id);

    // Verify cell is empty
    const cellAfterReset = await t.run(async (ctx) => {
      return await ctx.db.get(cell._id);
    });
    expect(cellAfterReset?.tileId).toBeNull();

    // Verify move was deleted
    const moves = await t.run(async (ctx) => {
      return await ctx.db
        .query("moves")
        .withIndex("by_turn", (q) => q.eq("gameId", game._id))
        .collect();
    });
    expect(moves.length).toBe(0);
  });

  test("should reset multiple tile placements", async () => {
    // Arrange: Create and start a game with known tiles
    const { game } = await gameHelper.createGame({
      playerNames: ["owner", "player_2"],
      playerTileValues: [[1, 2, 3], [4]],
    });

    const { player, user } = await gameHelper.getCurrentPlayer(game._id);

    // Place 3 tiles
    const placedTiles: Array<{ tileId: Id<"tiles">; cellId: Id<"cells"> }> = [];

    for (let i = 0; i < 3; i++) {
      const { tile, cell } = await gameHelper.findValidTileCellPair(game._id);
      placedTiles.push({ tileId: tile._id, cellId: cell._id });

      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile._id,
        cellId: cell._id,
        sessionId: user.sessionId as SessionId,
        playerId: player._id,
      });
    }

    // Act: Reset turn
    const result = await t.mutation(api.controllers.play.mutations.resetTurn, {
      gameId: game._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: 3 moves were reset
    expect(result).toMatchObject({
      status: "success",
      data: {
        movesReset: 3,
      },
    });

    // Verify all tiles are back in hand
    for (const { tileId } of placedTiles) {
      const tile = await t.run(async (ctx) => {
        return await ctx.db.get(tileId);
      });
      expect(tile?.location).toBe("in_hand");
    }

    // Verify all cells are empty
    for (const { cellId } of placedTiles) {
      const cell = await t.run(async (ctx) => {
        return await ctx.db.get(cellId);
      });
      expect(cell?.tileId).toBeNull();
    }
  });

  test("should fail when non-current player tries to reset", async () => {
    // Arrange: Create and start a game
    const { game, players, users } = await gameHelper.createGame({
      playerNames: ["owner", "player_2"],
    });

    // Get non-current player
    const nonCurrentPlayer = players.find((p) => !p.current)!;
    const nonCurrentPlayerIndex = players.indexOf(nonCurrentPlayer);
    const user = users[nonCurrentPlayerIndex];

    // Act: Try to reset turn as non-current player
    const result = await t.mutation(api.controllers.play.mutations.resetTurn, {
      gameId: game._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Should fail
    expect(result).toMatchObject({
      status: "error",
      data: expect.stringContaining("current player"),
    });
  });

  test("should preserve player's hand count after reset", async () => {
    // Arrange: Create and start a game with known tiles
    const { game } = await gameHelper.createGame({
      playerNames: ["owner", "player_2"],
      playerTileValues: [[1, 2], [3]],
    });

    const { player, user } = await gameHelper.getCurrentPlayer(game._id);

    // Count tiles before
    const tilesBeforePlacement = await gameHelper.getPlayerTiles(player._id);
    const initialHandCount = tilesBeforePlacement.length;

    // Place 2 tiles
    for (let i = 0; i < 2; i++) {
      const { tile, cell } = await gameHelper.findValidTileCellPair(game._id);
      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile._id,
        cellId: cell._id,
        sessionId: user.sessionId as SessionId,
        playerId: player._id,
      });
    }

    // Verify hand decreased
    const tilesAfterPlacement = await gameHelper.getPlayerTiles(player._id);
    expect(tilesAfterPlacement.length).toBe(initialHandCount - 2);

    // Act: Reset turn
    await t.mutation(api.controllers.play.mutations.resetTurn, {
      gameId: game._id,
      sessionId: user.sessionId as SessionId,
    });

    // Assert: Hand count restored to initial
    const tilesAfterReset = await gameHelper.getPlayerTiles(player._id);
    expect(tilesAfterReset.length).toBe(initialHandCount);
  });
});
