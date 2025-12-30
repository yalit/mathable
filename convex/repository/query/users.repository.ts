import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {QueryRepositoryInterface} from "../repositories.interface.ts";
import type {GenericDatabaseReader} from "convex/server";
import type {SessionId} from "convex-helpers/server/sessions";
import type {User} from "../../domain/models/User.ts";
import { userFromDoc } from "../../domain/models/factory/user.factory.ts";

export interface UsersQueryRepositoryInterface extends QueryRepositoryInterface<User, "users"> {
  findBySessionId: (sessionId: SessionId) => Promise<User | null>;
}

export class UsersQueryRepository implements UsersQueryRepositoryInterface {
  static instance: UsersQueryRepository;
  private db: GenericDatabaseReader<DataModel>;

  constructor(reader: GenericDatabaseReader<DataModel>) {
    this.db = reader;
  }

  private fromDocs(docs: Doc<"users">[]): User[] {
    return docs.map((d: Doc<"users">) => userFromDoc(d))
  }

  static create(reader: GenericDatabaseReader<DataModel>): UsersQueryRepository {
    if (!UsersQueryRepository.instance) {
      UsersQueryRepository.instance = new UsersQueryRepository(reader);
    }
    return UsersQueryRepository.instance;
  }

  async findAll(): Promise<User[]> {
    return this.fromDocs(await this.db.query("users").collect());
  }

  async find(id: Id<"users">): Promise<User | null> {
    const user = await this.db.get(id);
    if (!user) {
      return null;
    }

    return userFromDoc(user);
  }
  
  async findBySessionId(sessionId: SessionId): Promise<User | null> {
    const user =  await this.db
      .query("users")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();

    if (!user) {
      return null;
    }

    return userFromDoc(user);
  }
}

