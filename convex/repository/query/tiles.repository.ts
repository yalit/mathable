import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {QueryRepositoryInterface} from "../repositories.interface.ts";
import type {GenericDatabaseReader} from "convex/server";
import type {Tile} from "../../domain/models/Tile.ts";
import {tileFromDoc} from "../../domain/models/factory/tile.factory.ts";
import type {Player} from "../../domain/models/Player.ts";
import type {Game} from "../../domain/models/Game.ts";

export interface TilesQueryRepositoryInterface extends QueryRepositoryInterface<Tile, "tiles"> {
    findByPlayer: (player: Player) => Promise<Tile[]>;
    findAllByGame: (game: Game) => Promise<Tile[]>;
    findAllInBagByGame: (game: Game) => Promise<Tile[]>;
}

export class TilesQueryRepository implements TilesQueryRepositoryInterface {
    static instance: TilesQueryRepository;
    private db: GenericDatabaseReader<DataModel>;

    constructor(db: GenericDatabaseReader<DataModel>) {
        this.db = db;
    }

    static create(db: GenericDatabaseReader<DataModel>): TilesQueryRepositoryInterface {
        if (TilesQueryRepository.instance) {
            return TilesQueryRepository.instance;
        }
        TilesQueryRepository.instance = new this(db);
        return TilesQueryRepository.instance;
    }

    private fromDocs(docs: Doc<"tiles">[]): Tile[] {
        return docs.map((d: Doc<"tiles">) => tileFromDoc(d))
    }

    async findAll(): Promise<Tile[]> {
        return this.fromDocs(await this.db.query("tiles").collect());
    }

    async find(id: Id<"tiles">): Promise<Tile | null> {
        const tile = await this.db.get(id);
        if (!tile) {
            return null;
        }

        return tileFromDoc(tile)
    }

    async findByPlayer(player: Player): Promise<Tile[]> {
        const playerId = player.id;
        if (!playerId) return []

        return this.fromDocs(await this.db
            .query("tiles")
            .withIndex("by_player", (q) =>
                q.eq("playerId", playerId).eq("location", "in_hand"),
            )
            .collect()
        )
    }

    async findAllByGame(game: Game): Promise<Tile[]> {
        const gameId = game.id
        if(!gameId) return []

        return this.fromDocs(await this.db
            .query("tiles")
            .withIndex("by_game", (q) => q.eq("gameId", gameId))
            .collect()
        )
    }

    async findAllInBagByGame(game: Game): Promise<Tile[]> {
        const gameId = game.id
        if(!gameId) return []

        return this.fromDocs(await this.db
            .query("tiles")
            .withIndex("by_game_location", (q) =>
                q.eq("gameId", gameId).eq("location", "in_bag"),
            )
            .collect()
        )
    }
}