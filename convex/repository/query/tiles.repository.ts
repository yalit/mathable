import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {QueryRepositoryInterface} from "../repositories.interface.ts";
import type { GenericDatabaseReader } from "convex/server";

export interface TilesQueryRepositoryInterface extends QueryRepositoryInterface<"tiles"> {
  findByPlayer: (playerId: Id<"players">) => Promise<Doc<"tiles">[]>;
  findAllByGame: (gameId: Id<"games">) => Promise<Doc<"tiles">[]>;
  findAllInBagByGame: (gameId: Id<"games">) => Promise<Doc<"tiles">[]>;
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

  async findAll(): Promise<Doc<"tiles">[]> {
    return this.db.query("tiles").collect();
  }

  async find(id: Id<"tiles">): Promise<Doc<"tiles"> | null> {
    return this.db.get(id);
  }

    async findByPlayer(playerId: Id<"players">): Promise<Doc<"tiles">[]> {
        return this.db
        .query("tiles")
        .withIndex("by_player", (q) =>
            q.eq("playerId", playerId).eq("location", "in_hand"),
        )
        .collect();
    }

    async findAllByGame(gameId: Id<"games">): Promise<Doc<"tiles">[]> {
        return this.db
        .query("tiles")
        .withIndex("by_game", (q) => q.eq("gameId", gameId))
        .collect();
    }

    async findAllInBagByGame(gameId: Id<"games">): Promise<Doc<"tiles">[]> {
        return this.db
        .query("tiles")
        .withIndex("by_game_location", (q) =>
            q.eq("gameId", gameId).eq("location", "in_bag"),
        )
        .collect();
    }
}