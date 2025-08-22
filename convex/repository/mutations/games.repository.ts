import type {MutationRepositoryInterface} from "../repositories.interface.ts";
import type {GenericDatabaseWriter} from "convex/server";
import type {DataModel, Doc, Id} from "../../_generated/dataModel";

export interface GamesMutationRepositoryInterface extends MutationRepositoryInterface<"games"> {}


export class GamesMutationRepository implements GamesMutationRepositoryInterface {
    static instance: GamesMutationRepositoryInterface;
    private db: GenericDatabaseWriter<DataModel>

    private constructor(db?: GenericDatabaseWriter<DataModel>) {
        if (!db) {
            throw new Error("Database writer is required to instantiate the repository");
        }
        this.db = db;
    }

    static create(db: GenericDatabaseWriter<DataModel>): GamesMutationRepositoryInterface {
        if (!GamesMutationRepository.instance) {
            GamesMutationRepository.instance = new GamesMutationRepository(db);
        }
        return GamesMutationRepository.instance;
    }

    async new(data: Omit<Doc<"games">, "_id" | "_creationTime">): Promise<Id<"games">> {
        return await this.db.insert("games", data);
    }

    async patch(id: Id<"games">, data: Partial<Doc<"games">>): Promise<void> {
        await this.db.patch(id, data);
    }

    async delete(id: Id<"games">): Promise<void> {
        await this.db.delete(id);
    }
}