import type {Doc, Id} from "../../../_generated/dataModel";
import {createEmptyCell, createMultiplierCell, createOperatorCell, createValueCell} from "./cell.factory";
import {Game, type GameStatus} from "../Game.ts";
import {Cell} from "../Cell.ts";
import {Tile} from "../Tile.ts";
import {createTile} from "./tile.factory.ts";
import {UUID} from "./uuid.factory.ts";

export const createGame = (token: string): Game => {
    return new Game(
        null,
        token,
        "waiting",
        0
    )
}

export const createGameFromDoc = (doc: Doc<"games">): Game => {
    return new Game(
        doc._id,
        doc.token,
        doc.status as GameStatus,
        doc.currentTurn,
        doc.winner
    );
}

export const getBoardCells = (gameId: Id<"games">): Cell[] => {
    const cells: Cell[] = [];

    // 3x Multipliers
    cells.push(createMultiplierCell(gameId, 0, 0, 3));
    cells.push(createMultiplierCell(gameId, 0, 6, 3));
    cells.push(createMultiplierCell(gameId, 0, 7, 3));
    cells.push(createMultiplierCell(gameId, 0, 13, 3));
    cells.push(createMultiplierCell(gameId, 6, 0, 3));
    cells.push(createMultiplierCell(gameId, 6, 13, 3));
    cells.push(createMultiplierCell(gameId, 13, 0, 3));
    cells.push(createMultiplierCell(gameId, 13, 6, 3));
    cells.push(createMultiplierCell(gameId, 13, 7, 3));
    cells.push(createMultiplierCell(gameId, 13, 13, 3));
    cells.push(createMultiplierCell(gameId, 7, 0, 3));
    cells.push(createMultiplierCell(gameId, 7, 13, 3));

    //2x Multipliers
    cells.push(createMultiplierCell(gameId, 1, 1, 2));
    cells.push(createMultiplierCell(gameId, 1, 12, 2));
    cells.push(createMultiplierCell(gameId, 2, 2, 2));
    cells.push(createMultiplierCell(gameId, 2, 11, 2));
    cells.push(createMultiplierCell(gameId, 3, 3, 2));
    cells.push(createMultiplierCell(gameId, 3, 10, 2));
    cells.push(createMultiplierCell(gameId, 4, 4, 2));
    cells.push(createMultiplierCell(gameId, 4, 9, 2));
    cells.push(createMultiplierCell(gameId, 12, 1, 2));
    cells.push(createMultiplierCell(gameId, 12, 12, 2));
    cells.push(createMultiplierCell(gameId, 11, 2, 2));
    cells.push(createMultiplierCell(gameId, 11, 11, 2));
    cells.push(createMultiplierCell(gameId, 10, 3, 2));
    cells.push(createMultiplierCell(gameId, 10, 10, 2));
    cells.push(createMultiplierCell(gameId, 9, 4, 2));
    cells.push(createMultiplierCell(gameId, 9, 9, 2));

    // + Operators
    cells.push(createOperatorCell(gameId, 3, 6, "+"));
    cells.push(createOperatorCell(gameId, 4, 7, "+"));
    cells.push(createOperatorCell(gameId, 6, 4, "+"));
    cells.push(createOperatorCell(gameId, 7, 3, "+"));
    cells.push(createOperatorCell(gameId, 6, 10, "+"));
    cells.push(createOperatorCell(gameId, 7, 9, "+"));
    cells.push(createOperatorCell(gameId, 9, 6, "+"));
    cells.push(createOperatorCell(gameId, 10, 7, "+"));

    //, Operators
    cells.push(createOperatorCell(gameId, 2, 5, "-"));
    cells.push(createOperatorCell(gameId, 2, 8, "-"));
    cells.push(createOperatorCell(gameId, 5, 2, "-"));
    cells.push(createOperatorCell(gameId, 8, 2, "-"));
    cells.push(createOperatorCell(gameId, 5, 11, "-"));
    cells.push(createOperatorCell(gameId, 8, 11, "-"));
    cells.push(createOperatorCell(gameId, 11, 5, "-"));
    cells.push(createOperatorCell(gameId, 11, 8, "-"));

    // * Operators
    cells.push(createOperatorCell(gameId, 3, 7, "*"));
    cells.push(createOperatorCell(gameId, 4, 6, "*"));
    cells.push(createOperatorCell(gameId, 6, 3, "*"));
    cells.push(createOperatorCell(gameId, 7, 4, "*"));
    cells.push(createOperatorCell(gameId, 6, 9, "*"));
    cells.push(createOperatorCell(gameId, 7, 10, "*"));
    cells.push(createOperatorCell(gameId, 9, 7, "*"));
    cells.push(createOperatorCell(gameId, 10, 6, "*"));

    // / Operators
    cells.push(createOperatorCell(gameId, 1, 4, "/"));
    cells.push(createOperatorCell(gameId, 1, 9, "/"));
    cells.push(createOperatorCell(gameId, 4, 1, "/"));
    cells.push(createOperatorCell(gameId, 9, 1, "/"));
    cells.push(createOperatorCell(gameId, 4, 12, "/"));
    cells.push(createOperatorCell(gameId, 9, 12, "/"));
    cells.push(createOperatorCell(gameId, 12, 4, "/"));
    cells.push(createOperatorCell(gameId, 12, 9, "/"));

    // central placed digits
    cells.push(createValueCell(gameId, 6, 6, 1));
    cells.push(createValueCell(gameId, 6, 7, 2));
    cells.push(createValueCell(gameId, 7, 6, 3));
    cells.push(createValueCell(gameId, 7, 7, 4));

    const index = (row: number, col: number): number => row * Game.gameSize() + col;

    const indexes = new Set();
    cells.forEach((c) => indexes.add(index(c.row, c.column)));

    for (let r = 0; r < Game.gameSize(); r++) {
        for (let c = 0; c < Game.gameSize(); c++) {
            if (indexes.has(index(r, c))) {
                continue;
            }
            cells.push(createEmptyCell(gameId, r, c));
        }
    }

    return cells;
};

export const getInitialGameTiles = (gameId: Id<"games">): Tile[] => {
    const tiles: Tile[] = [];

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((v) => {
        for (let n = 1; n <= 7; n++) {
            tiles.push(createTile(null, gameId, v));
        }
    });
    [
        0, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 25, 27, 28, 30, 32, 35,
        36, 40, 42, 45, 48, 49, 50, 54, 56, 60, 63, 64, 70, 72, 80, 81, 90,
    ].forEach((n) => tiles.push(createTile(null, gameId, n)));
    return tiles;
};
