import type {Player} from "../../models/Player.ts";
import type { Tile } from "../../models/Tile.ts";
import type { CellsQueryRepositoryInterface } from "../../../repository/query/cells.repository.ts";
import type {GamesQueryRepositoryInterface} from "../../../repository/query/games.repository.ts";
import type {CellsMutationRepositoryInterface} from "../../../repository/mutations/cells.repository.ts";
import type { TilesMutationRepositoryInterface } from "../../../repository/mutations/tiles.repository.ts";
import type {Cell} from "../../models/Cell.ts";

export interface TileMoveServiceInterface {
    moveToPlayer: (tile: Tile, player: Player) => Promise<void>;
    moveToCell: (tile: Tile, newCell: Cell, player: Player) => Promise<void>;
    moveToBag: (tile: Tile) => Promise<void>;
}

export class TileMoveService implements TileMoveServiceInterface {
    private static instance: TileMoveServiceInterface;
    private readonly gamesQuery: GamesQueryRepositoryInterface;
    private readonly cellsQuery: CellsQueryRepositoryInterface;
    private readonly cellsMutation: CellsMutationRepositoryInterface;
    private readonly tilesMutation: TilesMutationRepositoryInterface;

    constructor(
        gamesQuery: GamesQueryRepositoryInterface,
        cellsQuery: CellsQueryRepositoryInterface,
        cellsMutation: CellsMutationRepositoryInterface,
        tilesMutation: TilesMutationRepositoryInterface
    ) {
        this.gamesQuery = gamesQuery;
        this.cellsQuery = cellsQuery;
        this.cellsMutation = cellsMutation;
        this.tilesMutation = tilesMutation;
    }

    static create(
        gamesQuery: GamesQueryRepositoryInterface,
        cellsQuery: CellsQueryRepositoryInterface,
        cellsMutation: CellsMutationRepositoryInterface,
        tilesMutation: TilesMutationRepositoryInterface
    ): TileMoveServiceInterface {
        if (!TileMoveService.instance) {
            TileMoveService.instance = new TileMoveService(
                gamesQuery,
                cellsQuery,
                cellsMutation,
                tilesMutation
            );
        }
        return TileMoveService.instance;
    }

    async moveToPlayer(tile: Tile, player: Player): Promise<void> {
        const game = await this.gamesQuery.find(tile.gameId);
        if (!game) {
            return;
        }

        // remove the tile from any Cell
        const cell = await this.cellsQuery.findByTile(tile);
        if (cell) {
            cell.setTileId(null);
            await this.cellsMutation.save(cell);
        }

        // move the tile to the player and change its status
        tile.moveToPlayer(player.id);
        await this.tilesMutation.save(tile);
    }

    async moveToCell(tile: Tile, newCell: Cell, player: Player): Promise<void> {
        // Handle tile coming from another cell (displacement)
        // If tile is currently on a cell, remove it from the old cell
        if (tile.cellId) {
            const oldCell = await this.cellsQuery.find(tile.cellId);
            if (oldCell) {
                oldCell.setTileId(null);
                await this.cellsMutation.save(oldCell);
            }
        }

        // Set tile on the new cell
        if (newCell) {
            newCell.setTileId(tile.id);
            await this.cellsMutation.save(newCell);
        }

        // Update tile location (handles both from hand and from cell)
        tile.moveToCell(newCell, player);
        await this.tilesMutation.save(tile);
    }

    async moveToBag(tile: Tile): Promise<void> {
        // Handle tile coming from cell - remove from cell
        if (tile.cellId) {
            const cell = await this.cellsQuery.find(tile.cellId);
            if (cell) {
                cell.setTileId(null);
                await this.cellsMutation.save(cell);
            }
        }

        // Handle tile coming from player's hand - no additional cleanup needed
        // (tile.playerId will be cleared by moveToBag())
        tile.moveToBag();
        await this.tilesMutation.save(tile);
    }
}