import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {GenericDatabaseReader} from "convex/server";
import type {QueryRepositoryInterface} from "../repositories.interface.ts";
import {GAME_SIZE} from "../../../src/context/model/game.ts";
import {hasValue} from "../../helpers/cell.ts";

export interface CellsQueryRepositoryInterface extends QueryRepositoryInterface<"cells"> {
    findForGame: (gameId: Id<"games">) => Promise<Doc<"cells">[]>;
    findByRow: (gameId: Id<"games">, row: number, min: number, max: number) => Promise<Doc<"cells">[]>;
    findByColumn: (gameId: Id<"games">, column: number, min: number, max: number) => Promise<Doc<"cells">[]>;
    findAllForCellInEachDirection: (cell: Doc<"cells">) => Promise<Doc<"cells">[][]>;
    findAllImpactingCellsForCellInEachDirection: (cell: Doc<"cells">) => Promise<Doc<"cells">[][]>;
}

export class CellsQueryRepository implements CellsQueryRepositoryInterface {
    static instance: CellsQueryRepository;
    private db: GenericDatabaseReader<DataModel>;

    constructor(db: GenericDatabaseReader<DataModel>) {
        this.db = db;
    }

    static create(db: GenericDatabaseReader<DataModel>): CellsQueryRepositoryInterface {
        if (this) {
            return CellsQueryRepository.instance;
        }
        CellsQueryRepository.instance = new CellsQueryRepository(db);
        return CellsQueryRepository.instance;
    }

    async findAll(): Promise<Doc<"cells">[]> {
        return this.db.query("cells").collect();
    }

    async find(id: Id<"cells">): Promise<Doc<"cells"> | null> {
        return this.db.get(id);
    }

    async findForGame(gameId: Id<"games">): Promise<Doc<"cells">[]> {
        return this.db
            .query("cells")
            .withIndex("by_game_row_column", (q) => q.eq("gameId", gameId))
            .collect();
    }

    async findByRow(gameId: Id<"games">, row: number, min: number, max: number): Promise<Doc<"cells">[]> {
        return this.db
            .query("cells")
            .withIndex("by_game_row_column", (q) =>
                q
                    .eq("gameId", gameId)
                    .eq("row", row)
                    .gte("column", min)
                    .lt("column", max),
            )
            .collect();
    }

    async findByColumn(gameId: Id<"games">, column: number, min: number, max: number): Promise<Doc<"cells">[]> {
        return this.db
            .query("cells")
            .withIndex("by_game_column_row", (q) =>
                q
                    .eq("gameId", gameId)
                    .eq("column", column)
                    .gte("row", min)
                    .lt("row", max),
            )
            .collect();
    }
    
    async findAllForCellInEachDirection(cell: Doc<"cells">): Promise<Doc<"cells">[][]> {
        const left: Doc<"cells">[] = await this.findByRow(cell.gameId, cell.row, Math.max(0, cell.column - 2), cell.column)
        const right: Doc<"cells">[] = await this.findByRow(cell.gameId, cell.row, cell.column + 1, Math.min(GAME_SIZE, cell.column + 3))
        const up: Doc<"cells">[] = await this.findByColumn(cell.gameId, cell.column, Math.max(0, cell.row - 2), cell.row)
        const down: Doc<"cells">[] = await this.findByColumn(cell.gameId, cell.column, cell.row+1,  Math.max(GAME_SIZE, cell.row + 3))

        return [left, right, up, down];
    }


    async findAllImpactingCellsForCellInEachDirection(cell: Doc<"cells">): Promise<Doc<"cells">[][]> {
        const cells = await this.findAllForCellInEachDirection(cell);

        return [
            cells[0].filter((c) => hasValue(c)),
            cells[1].filter((c) => hasValue(c)),
            cells[2].filter((c) => hasValue(c)),
            cells[3].filter((c) => hasValue(c)),
        ];
    }
}