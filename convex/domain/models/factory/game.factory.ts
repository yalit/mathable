import type {Doc, Id} from "../../../_generated/dataModel";
import {createEmptyCell, createMultiplierCell, createOperatorCell, createValueCell} from "./cell.factory";
import {Game, type GameStatus} from "../Game.ts";
import {Cell} from "../Cell.ts";
import {Tile} from "../Tile.ts";
import {createTile} from "./tile.factory.ts";

export const gameFromDoc = (doc: Doc<"games">): Game => {
    return new Game(
        doc._id,
        doc.token,
        doc.status as GameStatus,
        doc.currentTurn,
        doc.winner
    );
}

export const getBoardCells = (game: Game): Cell[] => {
    const cells: Cell[] = [];

    // 3x Multipliers
    cells.push(createMultiplierCell(game, 0, 0, 3));
    cells.push(createMultiplierCell(game, 0, 6, 3));
    cells.push(createMultiplierCell(game, 0, 7, 3));
    cells.push(createMultiplierCell(game, 0, 13, 3));
    cells.push(createMultiplierCell(game, 6, 0, 3));
    cells.push(createMultiplierCell(game, 6, 13, 3));
    cells.push(createMultiplierCell(game, 13, 0, 3));
    cells.push(createMultiplierCell(game, 13, 6, 3));
    cells.push(createMultiplierCell(game, 13, 7, 3));
    cells.push(createMultiplierCell(game, 13, 13, 3));
    cells.push(createMultiplierCell(game, 7, 0, 3));
    cells.push(createMultiplierCell(game, 7, 13, 3));

    //2x Multipliers
    cells.push(createMultiplierCell(game, 1, 1, 2));
    cells.push(createMultiplierCell(game, 1, 12, 2));
    cells.push(createMultiplierCell(game, 2, 2, 2));
    cells.push(createMultiplierCell(game, 2, 11, 2));
    cells.push(createMultiplierCell(game, 3, 3, 2));
    cells.push(createMultiplierCell(game, 3, 10, 2));
    cells.push(createMultiplierCell(game, 4, 4, 2));
    cells.push(createMultiplierCell(game, 4, 9, 2));
    cells.push(createMultiplierCell(game, 12, 1, 2));
    cells.push(createMultiplierCell(game, 12, 12, 2));
    cells.push(createMultiplierCell(game, 11, 2, 2));
    cells.push(createMultiplierCell(game, 11, 11, 2));
    cells.push(createMultiplierCell(game, 10, 3, 2));
    cells.push(createMultiplierCell(game, 10, 10, 2));
    cells.push(createMultiplierCell(game, 9, 4, 2));
    cells.push(createMultiplierCell(game, 9, 9, 2));

    // + Operators
    cells.push(createOperatorCell(game, 3, 6, "+"));
    cells.push(createOperatorCell(game, 4, 7, "+"));
    cells.push(createOperatorCell(game, 6, 4, "+"));
    cells.push(createOperatorCell(game, 7, 3, "+"));
    cells.push(createOperatorCell(game, 6, 10, "+"));
    cells.push(createOperatorCell(game, 7, 9, "+"));
    cells.push(createOperatorCell(game, 9, 6, "+"));
    cells.push(createOperatorCell(game, 10, 7, "+"));

    //, Operators
    cells.push(createOperatorCell(game, 2, 5, "-"));
    cells.push(createOperatorCell(game, 2, 8, "-"));
    cells.push(createOperatorCell(game, 5, 2, "-"));
    cells.push(createOperatorCell(game, 8, 2, "-"));
    cells.push(createOperatorCell(game, 5, 11, "-"));
    cells.push(createOperatorCell(game, 8, 11, "-"));
    cells.push(createOperatorCell(game, 11, 5, "-"));
    cells.push(createOperatorCell(game, 11, 8, "-"));

    // * Operators
    cells.push(createOperatorCell(game, 3, 7, "*"));
    cells.push(createOperatorCell(game, 4, 6, "*"));
    cells.push(createOperatorCell(game, 6, 3, "*"));
    cells.push(createOperatorCell(game, 7, 4, "*"));
    cells.push(createOperatorCell(game, 6, 9, "*"));
    cells.push(createOperatorCell(game, 7, 10, "*"));
    cells.push(createOperatorCell(game, 9, 7, "*"));
    cells.push(createOperatorCell(game, 10, 6, "*"));

    // / Operators
    cells.push(createOperatorCell(game, 1, 4, "/"));
    cells.push(createOperatorCell(game, 1, 9, "/"));
    cells.push(createOperatorCell(game, 4, 1, "/"));
    cells.push(createOperatorCell(game, 9, 1, "/"));
    cells.push(createOperatorCell(game, 4, 12, "/"));
    cells.push(createOperatorCell(game, 9, 12, "/"));
    cells.push(createOperatorCell(game, 12, 4, "/"));
    cells.push(createOperatorCell(game, 12, 9, "/"));

    // central placed digits
    cells.push(createValueCell(game, 6, 6, 1));
    cells.push(createValueCell(game, 6, 7, 2));
    cells.push(createValueCell(game, 7, 6, 3));
    cells.push(createValueCell(game, 7, 7, 4));

    const index = (row: number, col: number): number => row * Game.gameSize() + col;

    const indexes = new Set();
    cells.forEach((c) => indexes.add(index(c.row, c.column)));

    for (let r = 0; r < Game.gameSize(); r++) {
        for (let c = 0; c < Game.gameSize(); c++) {
            if (indexes.has(index(r, c))) {
                continue;
            }
            cells.push(createEmptyCell(game, r, c));
        }
    }

    return cells;
};

export const getInitialGameTiles = (game: Game): Tile[] => {
    const tiles: Tile[] = [];

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((v) => {
        for (let n = 1; n <= 7; n++) {
            tiles.push(createTile(game, v));
        }
    });
    [
        0, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 25, 27, 28, 30, 32, 35,
        36, 40, 42, 45, 48, 49, 50, 54, 56, 60, 63, 64, 70, 72, 80, 81, 90,
    ].forEach((n) => tiles.push(createTile(game, n)));
    return tiles;
};
