import type {GenericDatabaseReader} from "convex/server";
import type {SessionId} from "convex-helpers/server/sessions";
import type {QueryRepositoryInterface} from "../repositories.interface.ts";
import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import {UsersQueryRepository} from "../query/users.repository.ts";
import {PlayersQueryRepository} from "../query/players.repository.ts";

export interface GameQueryRepositoryInterface extends QueryRepositoryInterface<"games"> {
  findByToken: (token: string) => Promise<Doc<"games"> | null>;
  findNonFinishedGamesForSessionId: (sessionId: SessionId) => Promise<Doc<"games">[]>;
}

export class GamesQueryRepository implements GameQueryRepositoryInterface {
  static instance: GamesQueryRepository;
  private db: GenericDatabaseReader<DataModel>;

  constructor(db: GenericDatabaseReader<DataModel>) {
    this.db = db;
  }

  static create(db: GenericDatabaseReader<DataModel>): GameQueryRepositoryInterface {
    if (GamesQueryRepository.instance) {
      return GamesQueryRepository.instance;
    }
    GamesQueryRepository.instance = new this(db);
    return GamesQueryRepository.instance;
  }

  async findAll(): Promise<Doc<"games">[]> {
    return this.db.query("games").collect();
  }

  async find(id: Id<"games">): Promise<Doc<"games"> | null> {
    return this.db.get(id);
  }

    async findByToken(token: string): Promise<Doc<"games"> | null> {
        return this.db
        .query("games")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();
    }

    async findNonFinishedGamesForSessionId(sessionId: SessionId): Promise<Doc<"games">[]> {
        const userWithSession: Doc<"users"> | null = await UsersQueryRepository.instance.findBySessionId(sessionId);

        if (!userWithSession) {
            return [];
        }

        const playersWithSession: Doc<"players">[] = await PlayersQueryRepository.instance.findAllByUserId(userWithSession._id)

        const gamesID: Set<Id<"games">> = new Set();
        playersWithSession.forEach((p) => gamesID.add(p.gameId));

        const games: Doc<"games">[] = [];
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