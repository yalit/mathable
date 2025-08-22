import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {QueryRepositoryInterface} from "../repositories.interface.ts";
import type {GenericDatabaseReader} from "convex/server";

export interface PlayersQueryRepositoryInterface extends QueryRepositoryInterface<"players"> {
    findByToken: (token: string) => Promise<Doc<"players"> | null>;
    findByGame: (gameId: Id<"games">) => Promise<Doc<"players">[]>;
    findAllByUserId: (userId: Id<"users">) => Promise<Doc<"players">[]>;
    findCurrentPlayer: (gameId: Id<"games">) => Promise<Doc<"players"> | null>;
    findNextPlayer: (gameId: Id<"games">) => Promise<Doc<"players"> | null>;
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

    async findAll(): Promise<Doc<"players">[]> {
        return this.db.query("players").collect();
    }

    async find(id: Id<"players">): Promise<Doc<"players"> | null> {
        return this.db.get(id);
    }

    async findByToken(token: string): Promise<Doc<"players"> | null> {
        return this.db
            .query("players")
            .withIndex("by_token", (q) => q.eq("token", token))
            .unique();
    }

    async findByGame(gameId: Id<"games">): Promise<Doc<"players">[]> {
        return this.db
            .query("players")
            .withIndex("by_game", (q) => q.eq("gameId", gameId))
            .collect();
    }

    async findAllByUserId(userId: Id<"users">): Promise<Doc<"players">[]> {
        return this.db
            .query("players")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
    }

    async findCurrentPlayer(gameId: Id<"games">): Promise<Doc<"players"> | null> {
        return this.db
            .query("players")
            .withIndex("by_game_current", (q) => q.eq("gameId", gameId).eq("current", true))
            .unique();
    }

    async findNextPlayer(gameId: Id<"games">): Promise<Doc<"players"> | null> {
        const current = await this.findCurrentPlayer(gameId);
        if (!current) {
            return null;
        }
        const players = await this.findByGame(gameId);

        const nextOrder = current.order < players.length ? current.order + 1 : 1;
        const next = players.filter((p) => p.order === nextOrder);

        if (next.length !== 1) {
            return null;
        }
        return next[0];
    }
}
