import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {QueryRepositoryInterface} from "../repositories.interface.ts";
import type {GenericDatabaseReader} from "convex/server";
import type {SessionId} from "convex-helpers/server/sessions";

export interface UsersQueryRepositoryInterface extends QueryRepositoryInterface<"users"> {
  findBySessionId: (sessionId: SessionId) => Promise<Doc<"users"> | null>;
}

export class UsersQueryRepository implements UsersQueryRepositoryInterface {
  static instance: UsersQueryRepository;
  private db: GenericDatabaseReader<DataModel>;

  constructor(reader: GenericDatabaseReader<DataModel>) {
    this.db = reader;
  }

  static create(reader: GenericDatabaseReader<DataModel>): UsersQueryRepository {
    if (UsersQueryRepository.instance) {
      return UsersQueryRepository.instance;
    }
    UsersQueryRepository.instance = new this(reader);
    return UsersQueryRepository.instance;
  }

  async findAll(): Promise<Doc<"users">[]> {
    return this.db.query("users").collect();
  }

  async find(id: Id<"users">): Promise<Doc<"users"> | null> {
    return this.db.get(id);
  }
  
  async findBySessionId(sessionId: SessionId): Promise<Doc<"users"> | null> {
    return this.db
      .query("users")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();
  }
}

