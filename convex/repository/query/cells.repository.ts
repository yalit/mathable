import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {GenericDatabaseReader} from "convex/server";
import type {QueryRepositoryInterface} from "../repositories.interface.ts";
import {type Cell} from "../../domain/models/Cell.ts";
import {cellFromDoc} from "../../domain/models/factory/cell.factory.ts";
import type {TilesQueryRepositoryInterface} from "../../repository/query/tiles.repository.ts";
import type {Tile} from "../../domain/models/Tile.ts";
import {type Game, Game as GameModel} from "../../domain/models/Game.ts";
import type { GamesQueryRepositoryInterface } from "./games.repository.ts";

export interface CellsQueryRepositoryInterface
    extends QueryRepositoryInterface<Cell, "cells"> {
    findAllForGame: (game: Game) => Promise<Cell[]>;
    findByTile: (tile: Tile) => Promise<Cell | null>;
    findByRow: (
        game: Game,
        row: number,
        min: number,
        max: number,
    ) => Promise<Cell[]>;
    findByColumn: (
        game: Game,
        column: number,
        min: number,
        max: number,
    ) => Promise<Cell[]>;
    findCellInCrossFromCell: (
        cell: Cell,
    ) => Promise<Cell[][]>;
    findAllImpactingCellsForCellInEachDirection: (
        cell: Cell,
    ) => Promise<Cell[][]>;
    findNumericValue: (cell: Cell) => Promise<number>;
}

export class CellsQueryRepository implements CellsQueryRepositoryInterface {
    static instance: CellsQueryRepository;
    private readonly db: GenericDatabaseReader<DataModel>;
    private readonly tilesQueryRepository: TilesQueryRepositoryInterface;
    private readonly gamesQueryRepository: GamesQueryRepositoryInterface

    constructor(db: GenericDatabaseReader<DataModel>, tiles: TilesQueryRepositoryInterface, games: GamesQueryRepositoryInterface) {
        this.db = db;
        this.tilesQueryRepository = tiles
        this.gamesQueryRepository = games
    }

    static create(
        db: GenericDatabaseReader<DataModel>,
        tileRepositoryInterface: TilesQueryRepositoryInterface,
        gameQueryRepositoryInterface: GamesQueryRepositoryInterface

    ): CellsQueryRepositoryInterface {
        if (CellsQueryRepository.instance) {
            return CellsQueryRepository.instance;
        }
        CellsQueryRepository.instance = new CellsQueryRepository(db, tileRepositoryInterface, gameQueryRepositoryInterface);
        return CellsQueryRepository.instance;
    }

    private fromDocs(cells: Doc<"cells">[]): Cell[] {
        return cells.map((c: Doc<"cells">) => cellFromDoc(c))
    }

    async findAll(): Promise<Cell[]> {
        const cells = await this.db.query("cells").collect();
        return this.fromDocs(cells)
    }

    async find(id: Id<"cells">): Promise<Cell | null> {
        const cell = await this.db.get(id);
        if (!cell) {
            return null
        }

        return cellFromDoc(cell)
    }

    async findNumericValue(cell: Cell): Promise<number> {
        if (cell.isValueCell()) {
            return cell.value
        }

        if (!cell.tileId) {
            return -1
        }

        const tile = await this.tilesQueryRepository.find(cell.tileId)

        if (!tile) {
            return -1
        }

        return tile.value

    }

    async findAllForGame(game: Game): Promise<Cell[]> {
        const gameId = game.id
        if (!gameId) return []

        const cells = await this.db
            .query("cells")
            .withIndex("by_game_row_column", (q) => q.eq("gameId", gameId))
            .collect();

        return this.fromDocs(cells)
    }

    async findByTile(tile: Tile): Promise<Cell | null> {
        const tileId = tile.id
        if(!tileId) return null;

        const cell = await this.db
            .query("cells")
            .withIndex("by_tile", (q) => q.eq("tileId", tileId))
            .unique();

        if (!cell) {
            return null
        }

        return cellFromDoc(cell)
    }

    async findByRow(
        game: Game,
        row: number,
        min: number,
        max: number,
    ): Promise<Cell[]> {
        const gameId = game.id
        if (!gameId) return []

        return this.fromDocs(await this.db
            .query("cells")
            .withIndex("by_game_row_column", (q) =>
                q
                    .eq("gameId", gameId)
                    .eq("row", row)
                    .gte("column", min)
                    .lt("column", max),
            )
            .collect()
        )
    }

    async findByColumn(
        game: Game,
        column: number,
        min: number,
        max: number,
    ): Promise<Cell[]> {
        const gameId = game.id
        if (!gameId) return []

        return this.fromDocs(await this.db
            .query("cells")
            .withIndex("by_game_column_row", (q) =>
                q
                    .eq("gameId", gameId)
                    .eq("column", column)
                    .gte("row", min)
                    .lt("row", max),
            )
            .collect()
        )
    }

    async findCellInCrossFromCell(
        cell: Cell,
    ): Promise<Cell[][]> {
        const cellGame = await this.gamesQueryRepository.find(cell.gameId)
        if(!cellGame) return []

        const left: Cell[] = await this.findByRow(
            cellGame,
            cell.row,
            Math.max(0, cell.column - 2),
            cell.column,
        );
        const right: Cell[] = await this.findByRow(
            cellGame,
            cell.row,
            cell.column + 1,
            Math.min(GameModel.gameSize(), cell.column + 3),
        );
        const up: Cell[] = await this.findByColumn(
            cellGame,
            cell.column,
            Math.max(0, cell.row - 2),
            cell.row,
        );
        const down: Cell[] = await this.findByColumn(
            cellGame,
            cell.column,
            cell.row + 1,
            Math.min(GameModel.gameSize(), cell.row + 3),
        );

        return [left, right, up, down];
    }

    async findAllImpactingCellsForCellInEachDirection(
        cell: Cell,
    ): Promise<Cell[][]> {
        const cells = await this.findCellInCrossFromCell(cell);

        return [
            cells[0].filter((c) => c.hasValue()),
            cells[1].filter((c) => c.hasValue()),
            cells[2].filter((c) => c.hasValue()),
            cells[3].filter((c) => c.hasValue()),
        ];
    }
}
