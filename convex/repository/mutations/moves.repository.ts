import type {GenericDatabaseWriter} from "convex/server";
import type {DataModel} from "../../_generated/dataModel";
import type {DocData, MutationRepositoryInterface} from "../repositories.interface";
import {
    BagToPlayerMove,
    CellToPlayerMove,
    type Move,
    PlayerToBagMove,
    PlayerToCellMove
} from "../../domain/models/Move";
import {moveFromDoc} from "../../domain/models/factory/move.factory.ts";
import type {Game} from "../../domain/models/Game.ts";
import type {Tile} from "../../domain/models/Tile.ts";
import type {Player} from "../../domain/models/Player.ts";
import type {Cell} from "../../domain/models/Cell.ts";

export interface MovesMutationRepositoryInterface
    extends MutationRepositoryInterface<Move, "moves"> {
    newPlayerToCell: (game: Game, tile: Tile, player: Player, cell: Cell, score: number) => Promise<PlayerToCellMove>
    newBagToPlayer: (game: Game, tile: Tile, player: Player)=> Promise<BagToPlayerMove>
    newCellToPlayer:(game: Game, tile: Tile, player: Player, cell: Cell, score: number)=> Promise<CellToPlayerMove>
    newPlayerToBag: (game: Game, tile: Tile, player: Player) => Promise<PlayerToBagMove>
}

export class MovesMutationRepository
    implements MovesMutationRepositoryInterface {
    static instance: MovesMutationRepositoryInterface;
    private db: GenericDatabaseWriter<DataModel>;

    static create(
        db: GenericDatabaseWriter<DataModel>,
    ): MovesMutationRepositoryInterface {
        if (!MovesMutationRepository.instance) {
            MovesMutationRepository.instance = new MovesMutationRepository(db);
        }
        return MovesMutationRepository.instance;
    }

    private constructor(db: GenericDatabaseWriter<DataModel>) {
        this.db = db;
    }

    async delete(move: Move): Promise<void> {
        await this.db.delete(move.id);
    }

    async newPlayerToCell(
        game: Game,
        tile: Tile,
        player: Player,
        cell: Cell,
        score: number
    ): Promise<PlayerToCellMove> {
        return this.new({
            turn: game.currentTurn,
            type: "PLAYER_TO_CELL",
            cellId: cell.id,
            gameId: game.id,
            playerId: player.id,
            moveScore: score,
            tileId: tile.id
        }) as Promise<PlayerToCellMove>
    }

    async newBagToPlayer(
        game: Game,
        tile: Tile,
        player: Player,
    ): Promise<BagToPlayerMove> {
        return this.new({
            turn: game.currentTurn,
            type: "BAG_TO_PLAYER",
            cellId: null,
            gameId: game.id,
            playerId: player.id,
            moveScore: 0,
            tileId: tile.id
        }) as Promise<BagToPlayerMove>
    }

    async newCellToPlayer(
        game: Game,
        tile: Tile,
        player: Player,
        cell: Cell,
        score: number
    ): Promise<CellToPlayerMove> {
        return this.new({
            turn: game.currentTurn,
            type: "CELL_TO_PLAYER",
            cellId: cell.id,
            gameId: game.id,
            playerId: player.id,
            moveScore: score,
            tileId: tile.id
        }) as Promise<CellToPlayerMove>
    }

    async newPlayerToBag(
        game: Game,
        tile: Tile,
        player: Player,
    ): Promise<PlayerToBagMove> {
        return this.new({
            turn: game.currentTurn,
            type: "PLAYER_TO_BAG",
            cellId: null,
            gameId: game.id,
            playerId: player.id,
            moveScore: 0,
            tileId: tile.id
        }) as Promise<PlayerToBagMove>
    }

    async new(data: DocData<"moves">): Promise<Move> {
        const moveId = await this.db.insert("moves", data);
        return moveFromDoc({...data, _id: moveId, _creationTime: 0})
    }

    async save(move: Move): Promise<Move> {
        const docData = move.toDoc();

        // Update existing move - patch all fields
        await this.db.patch(move.id, docData);
        return move;
    }
}
