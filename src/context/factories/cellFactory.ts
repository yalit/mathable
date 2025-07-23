import type { Cell, CellOperator } from "../model/cell";

const baseCell = (row: number, column: number): Cell => {
  return {
    id: null,
    type: "empty",
    row,
    column,
    allowedValues: [],
  };
};

export const createEmptyCell = (row: number, column: number): Cell => {
  return {
    ...baseCell(row, column),
    type: "empty",
  };
};

export const createValueCell = (
  row: number,
  column: number,
  value: number,
): Cell => {
  return {
    ...baseCell(row, column),
    type: "value",
    value,
  };
};

export const createOperatorCell = (
  row: number,
  column: number,
  operator: CellOperator,
): Cell => {
  return {
    ...baseCell(row, column),
    type: "operator",
    operator,
  };
};

export const createMultiplierCell = (
  row: number,
  column: number,
  multiplier: number,
): Cell => {
  return {
    ...baseCell(row, column),
    type: "multiplier",
    multiplier,
  };
};
