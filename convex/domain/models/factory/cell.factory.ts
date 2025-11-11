import {
    type Cell,
    type CellOperator,
    type CellType,
    EmptyCell,
    MultiplierCell,
    OperatorCell,
    ValueCell
} from "../Cell.ts";
import type {Doc, Id} from "../../../_generated/dataModel";

export const createEmptyCell = (gameId: Id<"games">, row: number, column: number): EmptyCell => {
    return new EmptyCell(
        null,
        gameId,
        row,
        column,
        [],
        null
    )
};

export const createValueCell = (
    gameId: Id<"games">,
    row: number,
    column: number,
    value: number,
): ValueCell => {
    return new ValueCell(
        null,
        gameId,
        row,
        column,
        value,
        []
    )
};

export const createOperatorCell = (
    gameId: Id<"games">,
    row: number,
    column: number,
    operator: CellOperator,
): OperatorCell => {
    return new OperatorCell(
        null,
        gameId,
        row,
        column,
        operator,
        [],
        null
    )
};

export const createMultiplierCell = (
    gameId: Id<"games">,
    row: number,
    column: number,
    multiplier: number,
): MultiplierCell => {
    return new MultiplierCell(
        null,
        gameId,
        row,
        column,
        multiplier,
        [],
        null,
    )
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
                doc.tileId
            );

        case "value":
            if (doc.value === null) {
                throw new Error(
                    `ValueCell at (${doc.row}, ${doc.column}) has no value`
                );
            }
            return new ValueCell(
                doc._id,
                doc.gameId,
                doc.row,
                doc.column,
                doc.value,
                doc.allowedValues
            );

        case "multiplier":
            if (doc.multiplier === null) {
                throw new Error(
                    `MultiplierCell at (${doc.row}, ${doc.column}) has no multiplier`
                );
            }
            return new MultiplierCell(
                doc._id,
                doc.gameId,
                doc.row,
                doc.column,
                doc.multiplier,
                doc.allowedValues,
                doc.tileId
            );

        case "operator":
            if (doc.operator === null) {
                throw new Error(
                    `OperatorCell at (${doc.row}, ${doc.column}) has no operator`
                );
            }
            return new OperatorCell(
                doc._id,
                doc.gameId,
                doc.row,
                doc.column,
                doc.operator as CellOperator,
                doc.allowedValues,
                doc.tileId
            );

        default:
            throw new Error(`Unknown cell type: ${type}`);
    }
};
