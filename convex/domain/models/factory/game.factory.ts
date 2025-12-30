import type {Doc} from "../../../_generated/dataModel";
import {Game, type GameStatus} from "../Game.ts";
import {createTileData} from "./tile.factory.ts";
import type {DocData} from "../../../repository/repositories.interface.ts";
import {
    createEmptyCellData,
    createMultiplierCellData,
    createOperatorCellData,
    createValueCellData
} from "./cell.factory.ts";

export const gameFromDoc = (doc: Doc<"games">): Game => {
    return new Game(
        doc._id,
        doc.token,
        doc.status as GameStatus,
        doc.currentTurn,
        doc.winner
    );
}

export const getBoardCellsData = (game: Game): DocData<"cells">[] => {
    const cells: DocData<"cells">[] = [];

    // 3x Multipliers
    cells.push(createMultiplierCellData(game, 0, 0, 3));
    cells.push(createMultiplierCellData(game, 0, 6, 3));
    cells.push(createMultiplierCellData(game, 0, 7, 3));
    cells.push(createMultiplierCellData(game, 0, 13, 3));
    cells.push(createMultiplierCellData(game, 6, 0, 3));
    cells.push(createMultiplierCellData(game, 6, 13, 3));
    cells.push(createMultiplierCellData(game, 13, 0, 3));
    cells.push(createMultiplierCellData(game, 13, 6, 3));
    cells.push(createMultiplierCellData(game, 13, 7, 3));
    cells.push(createMultiplierCellData(game, 13, 13, 3));
    cells.push(createMultiplierCellData(game, 7, 0, 3));
    cells.push(createMultiplierCellData(game, 7, 13, 3));

    //2x Multipliers
    cells.push(createMultiplierCellData(game, 1, 1, 2));
    cells.push(createMultiplierCellData(game, 1, 12, 2));
    cells.push(createMultiplierCellData(game, 2, 2, 2));
    cells.push(createMultiplierCellData(game, 2, 11, 2));
    cells.push(createMultiplierCellData(game, 3, 3, 2));
    cells.push(createMultiplierCellData(game, 3, 10, 2));
    cells.push(createMultiplierCellData(game, 4, 4, 2));
    cells.push(createMultiplierCellData(game, 4, 9, 2));
    cells.push(createMultiplierCellData(game, 12, 1, 2));
    cells.push(createMultiplierCellData(game, 12, 12, 2));
    cells.push(createMultiplierCellData(game, 11, 2, 2));
    cells.push(createMultiplierCellData(game, 11, 11, 2));
    cells.push(createMultiplierCellData(game, 10, 3, 2));
    cells.push(createMultiplierCellData(game, 10, 10, 2));
    cells.push(createMultiplierCellData(game, 9, 4, 2));
    cells.push(createMultiplierCellData(game, 9, 9, 2));

    // + Operators
    cells.push(createOperatorCellData(game, 3, 6, "+"));
    cells.push(createOperatorCellData(game, 4, 7, "+"));
    cells.push(createOperatorCellData(game, 6, 4, "+"));
    cells.push(createOperatorCellData(game, 7, 3, "+"));
    cells.push(createOperatorCellData(game, 6, 10, "+"));
    cells.push(createOperatorCellData(game, 7, 9, "+"));
    cells.push(createOperatorCellData(game, 9, 6, "+"));
    cells.push(createOperatorCellData(game, 10, 7, "+"));

    //, Operators
    cells.push(createOperatorCellData(game, 2, 5, "-"));
    cells.push(createOperatorCellData(game, 2, 8, "-"));
    cells.push(createOperatorCellData(game, 5, 2, "-"));
    cells.push(createOperatorCellData(game, 8, 2, "-"));
    cells.push(createOperatorCellData(game, 5, 11, "-"));
    cells.push(createOperatorCellData(game, 8, 11, "-"));
    cells.push(createOperatorCellData(game, 11, 5, "-"));
    cells.push(createOperatorCellData(game, 11, 8, "-"));

    // * Operators
    cells.push(createOperatorCellData(game, 3, 7, "*"));
    cells.push(createOperatorCellData(game, 4, 6, "*"));
    cells.push(createOperatorCellData(game, 6, 3, "*"));
    cells.push(createOperatorCellData(game, 7, 4, "*"));
    cells.push(createOperatorCellData(game, 6, 9, "*"));
    cells.push(createOperatorCellData(game, 7, 10, "*"));
    cells.push(createOperatorCellData(game, 9, 7, "*"));
    cells.push(createOperatorCellData(game, 10, 6, "*"));

    // / Operators
    cells.push(createOperatorCellData(game, 1, 4, "/"));
    cells.push(createOperatorCellData(game, 1, 9, "/"));
    cells.push(createOperatorCellData(game, 4, 1, "/"));
    cells.push(createOperatorCellData(game, 9, 1, "/"));
    cells.push(createOperatorCellData(game, 4, 12, "/"));
    cells.push(createOperatorCellData(game, 9, 12, "/"));
    cells.push(createOperatorCellData(game, 12, 4, "/"));
    cells.push(createOperatorCellData(game, 12, 9, "/"));

    // central placed digits
    cells.push(createValueCellData(game, 6, 6, 1));
    cells.push(createValueCellData(game, 6, 7, 2));
    cells.push(createValueCellData(game, 7, 6, 3));
    cells.push(createValueCellData(game, 7, 7, 4));

    const index = (row: number, col: number): number => row * Game.gameSize() + col;

    const indexes = new Set();
    cells.forEach((c) => indexes.add(index(c.row, c.column)));

    for (let r = 0; r < Game.gameSize(); r++) {
        for (let c = 0; c < Game.gameSize(); c++) {
            if (indexes.has(index(r, c))) {
                continue;
            }
            cells.push(createEmptyCellData(game, r, c));
        }
    }

    return cells;
};

export const getInitialGameTiles = (game: Game): DocData<"tiles">[] => {
    const tiles: DocData<"tiles">[] = [];

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((v) => {
        for (let n = 1; n <= 7; n++) {
            tiles.push(createTileData(game, v));
        }
    });
    [
        0, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 25, 27, 28, 30, 32, 35,
        36, 40, 42, 45, 48, 49, 50, 54, 56, 60, 63, 64, 70, 72, 80, 81, 90,
    ].forEach((n) => tiles.push(createTileData(game, n)));
    return tiles;
};
