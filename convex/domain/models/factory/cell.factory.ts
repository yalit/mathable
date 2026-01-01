import {
  type Cell,
  type CellOperator,
  type CellType,
  EmptyCell,
  MultiplierCell,
  OperatorCell,
  ValueCell,
} from "../Cell.ts";
import type { Doc } from "../../../_generated/dataModel";
import type { Game } from "../Game.ts";
import type { DocData } from "@cvx/repository/repositories.interface.ts";

export const createEmptyCellData = (
  game: Game,
  row: number,
  column: number,
): DocData<"cells"> => {
  return {
    gameId: game.id,
    row,
    column,
    allowedValues: [],
    type: "empty",
    value: null,
    multiplier: null,
    operator: null,
    tileId: null,
  };
};

export const createValueCellData = (
  game: Game,
  row: number,
  column: number,
  value: number,
): DocData<"cells"> => {
  return {
    gameId: game.id,
    row,
    column,
    allowedValues: [],
    type: "value",
    value,
    multiplier: null,
    operator: null,
    tileId: null,
  };
};

export const createOperatorCellData = (
  game: Game,
  row: number,
  column: number,
  operator: CellOperator,
): DocData<"cells"> => {
  return {
    gameId: game.id,
    row,
    column,
    allowedValues: [],
    type: "operator",
    value: null,
    multiplier: null,
    operator,
    tileId: null,
  };
};

export const createMultiplierCellData = (
  game: Game,
  row: number,
  column: number,
  multiplier: number,
): DocData<"cells"> => {
  return {
    gameId: game.id,
    row,
    column,
    allowedValues: [],
    type: "multiplier",
    value: null,
    multiplier,
    operator: null,
    tileId: null,
  };
};

/**
 * Create appropriate Cell subclass from a database document
 * Factory function that returns the correct cell type based on doc.type
 * @param doc - Database document for a cell
 * @returns EmptyCell | ValueCell | MultiplierCell | OperatorCell
 * @throws Error if cell type is unknown
 */
export const cellFromDoc = (doc: Doc<"cells">): Cell => {
  const type = doc.type as CellType;

  switch (type) {
    case "empty":
      return new EmptyCell(
        doc._id,
        doc.gameId,
        doc.row,
        doc.column,
        doc.allowedValues,
        doc.tileId,
      );

    case "value":
      if (doc.value === null) {
        throw new Error(
          `ValueCell at (${doc.row}, ${doc.column}) has no value`,
        );
      }
      return new ValueCell(
        doc._id,
        doc.gameId,
        doc.row,
        doc.column,
        doc.value,
        doc.allowedValues,
      );

    case "multiplier":
      if (doc.multiplier === null) {
        throw new Error(
          `MultiplierCell at (${doc.row}, ${doc.column}) has no multiplier`,
        );
      }
      return new MultiplierCell(
        doc._id,
        doc.gameId,
        doc.row,
        doc.column,
        doc.multiplier,
        doc.allowedValues,
        doc.tileId,
      );

    case "operator":
      if (doc.operator === null) {
        throw new Error(
          `OperatorCell at (${doc.row}, ${doc.column}) has no operator`,
        );
      }
      return new OperatorCell(
        doc._id,
        doc.gameId,
        doc.row,
        doc.column,
        doc.operator as CellOperator,
        doc.allowedValues,
        doc.tileId,
      );

    default:
      throw new Error(`Unknown cell type: ${type}`);
  }
};
