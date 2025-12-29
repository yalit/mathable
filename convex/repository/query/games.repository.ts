import type {GenericDatabaseReader} from "convex/server";
import type {SessionId} from "convex-helpers/server/sessions";
import type {QueryRepositoryInterface} from "../repositories.interface.ts";
import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import {UsersQueryRepository} from "./users.repository.ts";
import {PlayersQueryRepository} from "./players.repository.ts";
import {TilesQueryRepository} from "./tiles.repository.ts";
import {MovesQueryRepository} from "./moves.repository.ts";
import type { Game } from "../../domain/models/Game.ts";
import type {Player} from "../../domain/models/Player.ts";
import {gameFromDoc} from "../../domain/models/factory/game.factory.ts";
import type {User} from "../../domain/models/User.ts";

export interface GamesQueryRepositoryInterface extends QueryRepositoryInterface<Game, "games"> {
    findByToken: (token: string) => Promise<Game | null>;
    findNonFinishedGamesForSessionId: (sessionId: SessionId) => Promise<Game[]>;
    isGameWon: (game: Game, player: Player) => Promise<boolean>;
    isGameIdle: (game: Game) => Promise<boolean>;
}

export class GamesQueryRepository implements GamesQueryRepositoryInterface {
    static instance: GamesQueryRepository;
    private db: GenericDatabaseReader<DataModel>;

    constructor(db: GenericDatabaseReader<DataModel>) {
        this.db = db;
    }

    static create(db: GenericDatabaseReader<DataModel>): GamesQueryRepositoryInterface {
        if (GamesQueryRepository.instance) {
            return GamesQueryRepository.instance;
        }
        GamesQueryRepository.instance = new this(db);
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

    async findNonFinishedGamesForSessionId(sessionId: SessionId): Promise<Game[]> {
        const userWithSession: User | null = await UsersQueryRepository.instance.findBySessionId(sessionId);

        if (!userWithSession) {
            return [];
        }

        const playersWithSession: Player[] = await PlayersQueryRepository.instance.findAllByUserId(userWithSession)

        const gamesID: Set<Id<"games">> = new Set();
        playersWithSession.forEach((p) => gamesID.add(p.gameId));

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

    // TODO : refactor that into a service in the domain
    async isGameWon(game: Game, player: Player): Promise<boolean> {
        const bagTiles = await TilesQueryRepository.instance.findAllInBagByGame(game);
        if (bagTiles.length > 0) {
            return false
        }

        const playerTiles = await TilesQueryRepository.instance.findByPlayer(player)

        return playerTiles.length === 0;
    }

    // TODO : refactor that into a service in the domain
    async isGameIdle(game: Game): Promise<boolean> {
        const lastMove = await MovesQueryRepository.instance.findLast(game);

        if (!lastMove) {
            return false;
        }

        const gamePlayers = await PlayersQueryRepository.instance.findByGame(game)

        return lastMove.turn < game.currentTurn - (2 * gamePlayers.length); // 2 turn by players not doing any moves
    }
}