import type {GenericDatabaseWriter} from "convex/server";
import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {MutationRepositoryInterface} from "../../repository/repositories.interface.ts";

export interface PlayersMutationRepositoryInterface extends MutationRepositoryInterface<"players"> {
}

export class PlayersMutationRepository implements PlayersMutationRepositoryInterface {
    static instance: PlayersMutationRepository;
    private db: GenericDatabaseWriter<DataModel>;

    constructor(db: GenericDatabaseWriter<DataModel>) {
        this.db = db;
    }

    static create(db: GenericDatabaseWriter<DataModel>): PlayersMutationRepositoryInterface {
        if (PlayersMutationRepository.instance) {
            return PlayersMutationRepository.instance;
        }
        PlayersMutationRepository.instance = new this(db);
        return PlayersMutationRepository.instance;
    }

    async new(data: Omit<Doc<"players">, "_id" | "_creationTime">): Promise<Id<"players">> {
        return this.db.insert("players", data);
    }

    async patch(id: Id<"players">, data: Partial<Doc<"players">>): Promise<void> {
        return this.db.patch(id, data);
    }

    async delete(id: Id<"players">): Promise<void> {
        return this.db.delete(id);
    }
}
