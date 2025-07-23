import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { UUID } from "../../../src/context/factories/uuidFactory";
import type { Cell } from "../../../src/context/model/cell";
import {
  createMultiplierCell,
  createOperatorCell,
  createEmptyCell,
  createValueCell,
} from "../../../src/context/factories/cellFactory";
import { GAME_SIZE } from "../../../src/context/model/game";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import type { Tile } from "../../../src/context/model/tile";

export default mutation({
  args: { gameName: v.string(), playerName: v.string() },
  handler: async (ctx, args) => {
    // create Game
    const gameId = await ctx.db.insert("games", {
      name: args.gameName,
      token: UUID(),
      status: "waiting",
    });
    // create playerName
    const playerId = await ctx.db.insert("players", {
      gameId: gameId,
      name: args.playerName,
      token: UUID(),
      current: false,
      score: 0,
    });
    // create Cells
    let boardCells = getBoardCells();
    boardCells = await Promise.all(
      boardCells.map(async (c) => {
        const cellId = await ctx.db.insert("cells", {
          gameId,
          row: c.row,
          column: c.column,
          allowedValues: [],
          type: c.type,
          value: c.value ?? null,
          multiplier: c.multiplier ?? null,
          operator: c.operator ?? null,
          tileId: null,
        });
        return {
          ...c,
          id: cellId,
        };
      }),
    );

    // create cellImpacts
    const cellImpacts = getBoardCellImpacts(boardCells);
    cellImpacts.forEach((ci) =>
      ctx.db.insert("cellImpacts", {
        direction: ci.direction,
        impactedCellId: ci.impactedCell.id as Id<"cells">,
        impactingCellId: ci.impactingCell.id as Id<"cells">,
      }),
    );

    // generate allowedValues
    await ctx.runMutation(
      internal.game.actions.computeAllowedValues.computeAllAllowedValues,
      { gameId },
    );

    // create Tiles
    getGameTiles().forEach(async (t: Tile) => {
      await ctx.db.insert("tiles", {
        gameId,
        value: t.value,
        location: t.location,
        playerId: null,
        cellId: null,
      });
    });

    return { gameId, playerId };
  },
});

const getBoardCells = (): Cell[] => {
  const cells: Cell[] = [];

  // 3x Multipliers
  cells.push(createMultiplierCell(0, 0, 3));
  cells.push(createMultiplierCell(0, 6, 3));
  cells.push(createMultiplierCell(0, 7, 3));
  cells.push(createMultiplierCell(0, 13, 3));
  cells.push(createMultiplierCell(6, 0, 3));
  cells.push(createMultiplierCell(6, 13, 3));
  cells.push(createMultiplierCell(13, 0, 3));
  cells.push(createMultiplierCell(13, 6, 3));
  cells.push(createMultiplierCell(13, 7, 3));
  cells.push(createMultiplierCell(13, 13, 3));
  cells.push(createMultiplierCell(7, 0, 3));
  cells.push(createMultiplierCell(7, 13, 3));

  //2x Multipliers
  cells.push(createMultiplierCell(1, 1, 2));
  cells.push(createMultiplierCell(1, 12, 2));
  cells.push(createMultiplierCell(2, 2, 2));
  cells.push(createMultiplierCell(2, 11, 2));
  cells.push(createMultiplierCell(3, 3, 2));
  cells.push(createMultiplierCell(3, 10, 2));
  cells.push(createMultiplierCell(4, 4, 2));
  cells.push(createMultiplierCell(4, 9, 2));
  cells.push(createMultiplierCell(12, 1, 2));
  cells.push(createMultiplierCell(12, 12, 2));
  cells.push(createMultiplierCell(11, 2, 2));
  cells.push(createMultiplierCell(11, 11, 2));
  cells.push(createMultiplierCell(10, 3, 2));
  cells.push(createMultiplierCell(10, 10, 2));
  cells.push(createMultiplierCell(9, 4, 2));
  cells.push(createMultiplierCell(9, 9, 2));

  // + Operators
  cells.push(createOperatorCell(3, 6, "+"));
  cells.push(createOperatorCell(4, 7, "+"));
  cells.push(createOperatorCell(6, 4, "+"));
  cells.push(createOperatorCell(7, 3, "+"));
  cells.push(createOperatorCell(6, 10, "+"));
  cells.push(createOperatorCell(7, 9, "+"));
  cells.push(createOperatorCell(9, 6, "+"));
  cells.push(createOperatorCell(10, 7, "+"));

  // - Operators
  cells.push(createOperatorCell(2, 5, "-"));
  cells.push(createOperatorCell(2, 8, "-"));
  cells.push(createOperatorCell(5, 2, "-"));
  cells.push(createOperatorCell(8, 2, "-"));
  cells.push(createOperatorCell(5, 11, "-"));
  cells.push(createOperatorCell(8, 11, "-"));
  cells.push(createOperatorCell(11, 5, "-"));
  cells.push(createOperatorCell(11, 8, "-"));

  // * Operators
  cells.push(createOperatorCell(3, 7, "*"));
  cells.push(createOperatorCell(4, 6, "*"));
  cells.push(createOperatorCell(6, 3, "*"));
  cells.push(createOperatorCell(7, 4, "*"));
  cells.push(createOperatorCell(6, 9, "*"));
  cells.push(createOperatorCell(7, 10, "*"));
  cells.push(createOperatorCell(9, 7, "*"));
  cells.push(createOperatorCell(10, 6, "*"));

  // / Operators
  cells.push(createOperatorCell(1, 4, "/"));
  cells.push(createOperatorCell(1, 9, "/"));
  cells.push(createOperatorCell(4, 1, "/"));
  cells.push(createOperatorCell(9, 1, "/"));
  cells.push(createOperatorCell(4, 12, "/"));
  cells.push(createOperatorCell(9, 12, "/"));
  cells.push(createOperatorCell(12, 4, "/"));
  cells.push(createOperatorCell(12, 9, "/"));

  // central placed digits
  cells.push(createValueCell(6, 6, 1));
  cells.push(createValueCell(6, 7, 2));
  cells.push(createValueCell(7, 6, 3));
  cells.push(createValueCell(7, 7, 4));

  const index = (row: number, col: number): number => row * GAME_SIZE + col;

  const indexes = new Set();
  cells.forEach((c) => indexes.add(index(c.row, c.column)));

  for (let r = 0; r < GAME_SIZE; r++) {
    for (let c = 0; c < GAME_SIZE; c++) {
      if (indexes.has(index(r, c))) {
        continue;
      }
      cells.push(createEmptyCell(r, c));
    }
  }

  return cells;
};

type BoardCellImpact = {
  direction: "up" | "down" | "left" | "right";
  impactedCell: Cell;
  impactingCell: Cell;
};
const getBoardCellImpacts = (cells: Cell[]): BoardCellImpact[] => {
  const impacts: BoardCellImpact[] = [];

  cells.forEach((impactedCell) => {
    // left
    let impactingCells = cells.filter(
      (c) =>
        c.column >= 0 &&
        c.row === impactedCell.row &&
        c.column >= impactedCell.column - 2,
    );
    impactingCells.forEach((impactingCell) => {
      impacts.push({ direction: "left", impactedCell, impactingCell });
    });

    // right
    impactingCells = cells.filter(
      (c) =>
        c.column < GAME_SIZE &&
        c.row === impactedCell.row &&
        c.column <= impactedCell.column + 2,
    );
    impactingCells.forEach((impactingCell) => {
      impacts.push({ direction: "right", impactedCell, impactingCell });
    });

    // down
    impactingCells = cells.filter(
      (c) =>
        c.row < GAME_SIZE &&
        c.column === impactedCell.column &&
        c.row <= impactedCell.row + 2,
    );
    impactingCells.forEach((impactingCell) => {
      impacts.push({ direction: "down", impactedCell, impactingCell });
    });

    // down
    impactingCells = cells.filter(
      (c) =>
        c.row >= 0 &&
        c.column === impactedCell.column &&
        c.row >= impactedCell.row - 2,
    );
    impactingCells.forEach((impactingCell) => {
      impacts.push({ direction: "down", impactedCell, impactingCell });
    });
  });

  return impacts;
};

const getGameTiles = (): Tile[] => {
  const tiles: Tile[] = [];

  return tiles;
};
