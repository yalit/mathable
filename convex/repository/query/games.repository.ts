import type {GenericDatabaseReader} from "convex/server";
import type {QueryRepositoryInterface} from "../repositories.interface.ts";
import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {Game} from "../../domain/models/Game.ts";
import type {Player} from "../../domain/models/Player.ts";
import {gameFromDoc} from "../../domain/models/factory/game.factory.ts";

export interface GamesQueryRepositoryInterface extends QueryRepositoryInterface<Game, "games"> {
    findByToken: (token: string) => Promise<Game | null>;
    findNonFinishedGamesForSessionId: (players: Player[]) => Promise<Game[]>;
}

export class GamesQueryRepository implements GamesQueryRepositoryInterface {
    static instance: GamesQueryRepository;
    private db: GenericDatabaseReader<DataModel>;

    constructor(db: GenericDatabaseReader<DataModel>) {
        this.db = db;
    }

    static create(db: GenericDatabaseReader<DataModel>): GamesQueryRepositoryInterface {
        if (!GamesQueryRepository.instance) {
            GamesQueryRepository.instance = new GamesQueryRepository(db)
        }
        return GamesQueryRepository.instance;
    }

    async fromDocs(docs: Doc<"games">[]): Promise<Game[]> {
        return docs.map((d) => gameFromDoc(d))
    }

    async findAll(): Promise<Game[]> {
        return this.fromDocs(await this.db.query("games").collect());
    }

    async find(id: Id<"games">): Promise<Game | null> {
        const game = await this.db.get(id);

        if (!game) return null;
        return gameFromDoc(game);
    }

    async findByToken(token: string): Promise<Game | null> {
        const game = await this.db
            .query("games")
            .withIndex("by_token", (q) => q.eq("token", token))
            .unique();

        if (!game) return null;
        return gameFromDoc(game);
    }

    async findNonFinishedGamesForSessionId(players: Player[]): Promise<Game[]> {
        const gamesID: Set<Id<"games">> = new Set();
        players.forEach((p) => gamesID.add(p.gameId));

        const games: Game[] = [];
        await Promise.all(
            Array.from(gamesID).map(async (id: Id<"games">) => {
                const game = await this.find(id)

                if (game !== null && game.status !== "ended") {
                    games.push(game);
                }
            }),
        );
        return games;
    }
}