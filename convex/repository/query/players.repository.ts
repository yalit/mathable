import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {QueryRepositoryInterface} from "../repositories.interface.ts";
import type {GenericDatabaseReader} from "convex/server";
import type {Player} from "../../domain/models/Player.ts";
import {playerFromDoc} from "../../domain/models/factory/player.factory.ts";
import type {Game} from "../../domain/models/Game.ts";
import type {User} from "../../domain/models/User.ts";

export interface PlayersQueryRepositoryInterface extends QueryRepositoryInterface<Player, "players"> {
    findByToken: (token: string) => Promise<Player | null>;
    findByGame: (game: Game) => Promise<Player[]>;
    findAllByUserId: (user: User) => Promise<Player[]>;
    findCurrentPlayer: (game: Game) => Promise<Player | null>;
    findNextPlayer: (game: Game) => Promise<Player | null>;
}

export class PlayersQueryRepository implements PlayersQueryRepositoryInterface {
    static instance: PlayersQueryRepository;
    private db: GenericDatabaseReader<DataModel>;

    constructor(db: GenericDatabaseReader<DataModel>) {
        this.db = db;
    }

    static create(db: GenericDatabaseReader<DataModel>): PlayersQueryRepositoryInterface {
        if (PlayersQueryRepository.instance) {
            return PlayersQueryRepository.instance;
        }
        PlayersQueryRepository.instance = new this(db);
        return PlayersQueryRepository.instance;
    }

    private fromDocs(docs: Doc<"players">[]): Player[] {
        return docs.map((d: Doc<"players">) => playerFromDoc(d))
    }

    async findAll(): Promise<Player[]> {
        return this.fromDocs(await this.db.query("players").collect());
    }

    async find(id: Id<"players">): Promise<Player | null> {
        const player = await this.db.get(id);

        if (!player) {
            return null
        }

        return playerFromDoc(player)
    }

    async findByToken(token: string): Promise<Player | null> {
        const player = await this.db
            .query("players")
            .withIndex("by_token", (q) => q.eq("token", token))
            .unique();

        if (!player) {
            return null
        }

        return playerFromDoc(player)
    }

    async findByGame(game: Game): Promise<Player[]> {
        const gameID = game.id
        if (!gameID) return []

        return this.fromDocs(await this.db
            .query("players")
            .withIndex("by_game", (q) => q.eq("gameId", gameID))
            .collect()
        );
    }

    async findAllByUserId(user: User): Promise<Player[]> {
        const userId = user.id
        if (!userId) return []

        return this.fromDocs(await this.db
            .query("players")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect()
        );
    }

    async findCurrentPlayer(game: Game): Promise<Player | null> {
        const gameId = game.id
        if (!gameId) return null

        const player = await this.db
            .query("players")
            .withIndex("by_game_current", (q) => q.eq("gameId", gameId).eq("current", true))
            .unique();

        if (!player) {
            return null
        }

        return playerFromDoc(player)
    }

    async findNextPlayer(game: Game): Promise<Player | null> {
        const current = await this.findCurrentPlayer(game);
        if (!current) {
            return null;
        }
        const players = await this.findByGame(game);

        const nextOrder = current.order < players.length ? current.order + 1 : 1;
        const next = players.filter((p) => p.order === nextOrder);

        if (next.length !== 1) {
            return null;
        }
        return next[0];
    }
}
