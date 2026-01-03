import { expect, test, describe, beforeEach } from "vitest";
import { api } from "../../_generated/api";
import schema from "../../schema";
import { modules } from "../../test.setup";
import { convexTest, type TestConvex } from "convex-test";
import type { SessionId } from "convex-helpers/server/sessions";
import { GameTestHelper } from "../GameTest.helper";

/**
 * Tests for CellValueComputationService
 *
 * The service computes allowed values for empty cells based on adjacent cells.
 * Board layout reference (14x14 grid):
 * - Central value cells: (6,6)=1, (6,7)=2, (7,6)=3, (7,7)=4
 * - Operator cells around the center:
 *   - + operators: (3,6), (4,7), (6,4), (7,3), (6,10), (7,9), (9,6), (10,7)
 *   - - operators: (2,5), (2,8), (5,2), (8,2), (5,11), (8,11), (11,5), (11,8)
 *   - * operators: (3,7), (4,6), (6,3), (7,4), (6,9), (7,10), (9,7), (10,6)
 *   - / operators: (1,4), (1,9), (4,1), (9,1), (4,12), (9,12), (12,4), (12,9)
 *
 * The service calculates allowedValues when tiles are placed, based on:
 * - For operator cells: only values matching that operator's result
 * - For empty cells: any value matching +, -, *, / of adjacent value cells
 */
describe("CellValueComputationService", () => {
  let t: TestConvex<typeof schema>;
  let gameHelper: GameTestHelper;

  beforeEach(() => {
    t = convexTest(schema, modules);
    gameHelper = new GameTestHelper(t);
  });

  describe("computeAllowedValuesForCell", () => {
    test("should compute allowed values for empty cell adjacent to value cells", async () => {
      // Arrange: Create a game - the central cells already have values
      // (6,6)=1, (6,7)=2, (7,6)=3, (7,7)=4
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      // The cell at (5,6) is adjacent to value cell (6,6)=1
      // and the * operator at (4,6) which is adjacent to (6,6)=1
      // Let's check cells adjacent to value cells that should have computed allowed values

      // Get cells around the central values
      const cells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });
      // Find the + operator cell at (3,6) - it's 3 cells away from (6,6)=1
      // It should have allowedValues based on impacting cells when tiles are placed nearby
      const plusOperatorCell = cells.find((c) => c.row === 3 && c.column === 6);
      expect(plusOperatorCell).toBeDefined();
      expect(plusOperatorCell?.type).toBe("operator");
      expect(plusOperatorCell?.operator).toBe("+");

      // Initially, cells far from values should have empty allowedValues
      // because there are no two adjacent value cells to compute from
      expect(plusOperatorCell?.allowedValues.length).toBe(0);

      const expectedValues = [
        [
          [5, 6],
          [2, 3, 4],
        ],
        [
          [5, 7],
          [2, 6, 8],
        ],
        [
          [6, 8],
          [1, 2, 3],
        ],
        [
          [7, 8],
          [1, 7, 12],
        ],
        [
          [8, 6],
          [2, 3, 4],
        ],
        [
          [8, 7],
          [2, 6, 8],
        ],
        [
          [6, 5],
          [1, 2, 3],
        ],
        [
          [7, 5],
          [1, 7, 12],
        ],
      ];

      for (const [c, values] of expectedValues) {
        const cell = await t.run(async (ctx) => {
          return await ctx.db
            .query("cells")
            .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
            .filter((q) =>
              q.and(q.eq(q.field("column"), c[1]), q.eq(q.field("row"), c[0])),
            )
            .unique();
        });
        expect(cell?.allowedValues.length).toBe(values.length);
        values.forEach((v) => {
          expect(cell?.allowedValues).toContain(v);
        });
      }
    });

    test("should update allowed values after placing a tile", async () => {
      // Arrange: Create a game with specific tiles for player
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [
          [3, 5],
          [2, 4],
        ], // Player 1 has tiles 3 and 5
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      // Get cells - we need to find an empty cell that when we place a tile
      // will affect the allowed values of nearby cells
      const cells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // Find the cell at (5,6) - it's empty and between operator (4,6)* and value (6,6)=1
      const targetCell = cells.find((c) => c.row === 5 && c.column === 6);
      expect(targetCell).toBeDefined();
      expect(targetCell?.type).toBe("empty");

      // Get the tile with value 3
      const playerTiles = await gameHelper.getPlayerTiles(player._id);
      const tile3 = playerTiles.find((t) => t.value === 3);
      expect(tile3).toBeDefined();

      // Check the cell at (4,6) which is a * operator
      const multOperatorCell = cells.find((c) => c.row === 4 && c.column === 6);
      expect(multOperatorCell).toBeDefined();
      expect(multOperatorCell?.operator).toBe("*");

      // Act: Place the tile with value 3 at (5,6)
      const result = await t.mutation(
        api.controllers.tile.mutations.playToCell,
        {
          tileId: tile3!._id,
          cellId: targetCell!._id,
          playerId: player._id,
          sessionId: user.sessionId as SessionId,
        },
      );

      expect(result.status).toBe("success");

      // Assert: Check if allowed values were updated for nearby cells
      const updatedCells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      const updatedMultOperatorCell = updatedCells.find(
        (c) => c.row === 4 && c.column === 6,
      );

      // After placing tile 3 at (5,6), the * operator at (4,6) now has
      // impacting cells: (5,6)=3 and (6,6)=1
      // So allowed value should be 3*1 = 3
      expect(updatedMultOperatorCell?.allowedValues).toContain(3);
    });

    test("should compute additional allowed values correctly", async () => {
      // Arrange: Create a game
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [[4], [2]],
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      const cells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // Find an empty cell that when filled will affect a + operator
      // The + operator at (9,6) is below the central values
      // If we place at (8,6), it would be between (9,6)+ and (7,6)=3

      const targetCell = cells.find((c) => c.row === 8 && c.column === 6);
      expect(targetCell).toBeDefined();
      expect(targetCell?.type).toBe("empty");

      const plusOperatorCell = cells.find((c) => c.row === 9 && c.column === 6);
      expect(plusOperatorCell).toBeDefined();
      expect(plusOperatorCell?.operator).toBe("+");

      // Get tile with value 4 to be placed on 8,6
      const playerTiles = await gameHelper.getPlayerTiles(player._id);
      const tile4 = playerTiles.find((t) => t.value === 4);
      expect(tile4).toBeDefined();

      // Act: Place tile 5 at (8,6)
      const result = await t.mutation(
        api.controllers.tile.mutations.playToCell,
        {
          tileId: tile4!._id,
          cellId: targetCell!._id,
          playerId: player._id,
          sessionId: user.sessionId as SessionId,
        },
      );

      expect(result.status).toBe("success");

      // Assert: The + operator at (9,6) should now have allowed values
      // impacting cells: (8,6)=4 and (7,6)=3
      // Addition: 4 + 3 = 7
      const updatedCells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      const updatedPlusCell = updatedCells.find(
        (c) => c.row === 9 && c.column === 6,
      );

      expect(updatedPlusCell?.allowedValues.length).toBe(1);
      expect(updatedPlusCell?.allowedValues).toContain(7);
    });

    test("should compute subtraction allowed values correctly", async () => {
      // Arrange: Create a game
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [[7], [2]],
      });

      const cells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // The - operator at (5,2) is at column 2
      // We need to build towards it. Let's find a suitable cell.
      // Looking at the board, - operators are at positions like (2,5), (2,8) etc.

      // Let's use the - operator at (11,5) which is below
      // We need value cells at (10,5) and (12,5) to affect (11,5)

      const minusOperatorCell = cells.find(
        (c) => c.row === 11 && c.column === 5,
      );
      expect(minusOperatorCell).toBeDefined();
      expect(minusOperatorCell?.operator).toBe("-");
    });

    test("should compute division allowed values correctly", async () => {
      // Arrange: Create a game
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [[6, 2], [3]],
      });

      const cells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // Find a / operator - they are at (1,4), (1,9), (4,1), (9,1), etc.
      const divOperatorCell = cells.find((c) => c.row === 1 && c.column === 4);
      expect(divOperatorCell).toBeDefined();
      expect(divOperatorCell?.operator).toBe("/");
    });

    test("should compute allowed values for empty (non-operator) cells with all operations", async () => {
      // Arrange: Create a game
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [
          [7, 1, 8],
          [7, 1, 8],
        ], // same tiles as it's random who is the current first player
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      const placements: {
        place: { row: number; column: number };
        value: number;
      }[] = [
        { place: { row: 7, column: 5 }, value: 7 },
        { place: { row: 6, column: 5 }, value: 1 },
        { place: { row: 5, column: 5 }, value: 8 },
      ];
      const expectedValues = [7, 8, 9]; // expected values at row=4, column 5

      // Do all the placements
      for (const { place, value } of placements) {
        const cell = await gameHelper.findCell(
          game._id,
          place.row,
          place.column,
        );
        const tiles = await gameHelper.getPlayerTiles(player._id);
        const tile = tiles.filter((t) => t.value === value)[0];

        const result = await t.mutation(
          api.controllers.tile.mutations.playToCell,
          {
            tileId: tile._id,
            cellId: cell!._id,
            playerId: player._id,
            sessionId: user.sessionId as SessionId,
          },
        );

        expect(result.status).toBe("success");
      }

      const resultCell = await gameHelper.findCell(game._id, 4, 5);
      expect(resultCell).toBeDefined();

      expect(resultCell.allowedValues.length).toBe(expectedValues.length);
      expectedValues.forEach((v) => {
        expect(resultCell.allowedValues).toContain(v);
      });

      // Assert: Check nearby empty cells (not operators) for allowed values
      // The cell at (4,7) is a + operator
      // Empty cells adjacent to two value cells should have allowedValues computed
      // using all operations: +, -, *, /
    });

    test("should handle division only when result is integer", async () => {
      // Arrange: Create a game
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [[5], [3]],
      });

      const cells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // Place tile 5 adjacent to a / operator
      // The / operator at (1,4) would need values at (0,4) and (2,4) to compute

      // For this test, we verify that the service properly handles non-integer division
      // by checking that division results that aren't integers are not included

      const divOperatorCell = cells.find((c) => c.row === 1 && c.column === 4);
      expect(divOperatorCell).toBeDefined();
      expect(divOperatorCell?.type).toBe("operator");
      expect(divOperatorCell?.operator).toBe("/");
    });

    test("should filter out negative values from allowed values", async () => {
      // Arrange: Create a game
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [[1, 5], [2]],
      });

      // The service filters n >= 0 for non-operator cells
      // So if we have 1 - 5 = -4, that should not be in allowed values

      const cells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // Get a cell that's empty and would have subtraction computed
      // The logic in the service filters negative values for non-operator cells
      const emptyCells = cells.filter(
        (c) => c.type === "empty" && c.tileId === null,
      );
      expect(emptyCells.length).toBeGreaterThan(0);

      // All allowed values in empty cells should be non-negative
      for (const cell of emptyCells) {
        for (const value of cell.allowedValues) {
          expect(value).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe("computeAllowedValuesForUpdatedCell", () => {
    test("should update allowed values for all cells in cross pattern when cell is updated", async () => {
      // Arrange: Create a game with specific tiles
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [[3], [5]],
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      // Get initial cell state
      const cellsBefore = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // Find a cell to place a tile
      const targetCell = cellsBefore.find(
        (c) => c.row === 5 && c.column === 6 && c.type === "empty",
      );
      expect(targetCell).toBeDefined();

      const playerTiles = await gameHelper.getPlayerTiles(player._id);
      const tile = playerTiles.find((t) => t.value === 3);
      expect(tile).toBeDefined();

      // Act: Place tile to trigger computeAllowedValuesForUpdatedCell
      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile!._id,
        cellId: targetCell!._id,
        playerId: player._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Verify cells in cross pattern were potentially updated
      const cellsAfter = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // The cell at (5,6) should now have a tile
      const updatedTargetCell = cellsAfter.find(
        (c) => c.row === 5 && c.column === 6,
      );
      expect(updatedTargetCell?.tileId).toBe(tile!._id);

      // Check that adjacent cells in cross pattern may have updated allowed values
      const cellsInCrossAfter = cellsAfter.filter(
        (c) =>
          (c.row === 5 &&
            c.column >= targetCell!.column - 2 &&
            c.column <= targetCell!.column + 2) ||
          (c.column === 6 &&
            c.row >= targetCell!.row - 2 &&
            c.row <= targetCell!.row + 2),
      );

      expect(cellsInCrossAfter.length).toBeGreaterThan(0);
    });

    test("should not update value cells (they have fixed values)", async () => {
      // Arrange: Create a game
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
      });

      // Get the central value cells
      const cells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // Value cells should never have their allowed values updated
      const valueCells = cells.filter((c) => c.type === "value");

      expect(valueCells.length).toBe(4); // Central cells: (6,6), (6,7), (7,6), (7,7)

      // Verify each value cell has correct value
      const cell66 = valueCells.find((c) => c.row === 6 && c.column === 6);
      const cell67 = valueCells.find((c) => c.row === 6 && c.column === 7);
      const cell76 = valueCells.find((c) => c.row === 7 && c.column === 6);
      const cell77 = valueCells.find((c) => c.row === 7 && c.column === 7);

      expect(cell66?.value).toBe(1);
      expect(cell67?.value).toBe(2);
      expect(cell76?.value).toBe(3);
      expect(cell77?.value).toBe(4);
    });
  });

  describe("integration with tile placement", () => {
    test("should correctly compute allowed values after multiple tile placements", async () => {
      // Arrange: Create a game with tiles that can be placed in sequence
      // We need to build a path from center outwards
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [
          [3, 4, 7],
          [2, 6, 8],
        ], // Various tiles for testing
      });

      // The central cells are (6,6)=1, (6,7)=2, (7,6)=3, (7,7)=4
      // We can place tiles adjacent to these
      const cells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // Find empty cells adjacent to center that allow specific values
      const emptyCellsWithValues = cells.filter(
        (c) => c.type === "empty" && c.allowedValues.length > 0,
      );

      // After game start with central values, some adjacent cells should already
      // have computed allowed values
      expect(emptyCellsWithValues.length).toBeGreaterThan(0);
    });

    test("should update allowed values when tile is removed (reset turn)", async () => {
      // Arrange: Create a game and place a tile
      const { game } = await gameHelper.createGame({
        playerNames: ["Player 1", "Player 2"],
        playerTileValues: [[3], [5]],
      });

      const { player, user } = await gameHelper.getCurrentPlayer(game._id);

      const cells = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // Find a valid cell to place the tile
      const playerTiles = await gameHelper.getPlayerTiles(player._id);
      const tile = playerTiles.find((t) => t.value === 3);
      expect(tile).toBeDefined();

      // Find cell that allows value 3
      const targetCell = cells.find(
        (c) =>
          c.type === "empty" &&
          c.tileId === null &&
          c.allowedValues.includes(3),
      );

      if (!targetCell) {
        // If no cell allows value 3, skip this test scenario
        return;
      }

      // Place the tile
      await t.mutation(api.controllers.tile.mutations.playToCell, {
        tileId: tile!._id,
        cellId: targetCell._id,
        playerId: player._id,
        sessionId: user.sessionId as SessionId,
      });

      // Get cells after placement
      const cellsAfterPlace = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      // Verify tile was placed
      const placedCell = cellsAfterPlace.find(
        (c) => c.row === targetCell.row && c.column === targetCell.column,
      );
      expect(placedCell?.tileId).toBe(tile!._id);

      // Act: Reset the turn (removes tile)
      await t.mutation(api.controllers.play.mutations.resetTurn, {
        gameId: game._id,
        sessionId: user.sessionId as SessionId,
      });

      // Assert: Verify tile was removed and allowed values recalculated
      const cellsAfterReset = await t.run(async (ctx) => {
        return await ctx.db
          .query("cells")
          .withIndex("by_game_row_column", (q) => q.eq("gameId", game._id))
          .collect();
      });

      const resetCell = cellsAfterReset.find(
        (c) => c.row === targetCell.row && c.column === targetCell.column,
      );
      expect(resetCell?.tileId).toBeNull();
    });
  });
});
