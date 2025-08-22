import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {GenericDatabaseWriter} from "convex/server";
import type {MutationRepositoryInterface} from "../repositories.interface.ts";

export interface UsersMutationRepositoryInterface extends MutationRepositoryInterface<"users"> {}

export class UsersMutationRepository implements UsersMutationRepositoryInterface {
    static instance: UsersMutationRepository;
    private db: GenericDatabaseWriter<DataModel>;

    constructor(writer: GenericDatabaseWriter<DataModel>) {
        this.db = writer;
    }

    static create(writer: GenericDatabaseWriter<DataModel>): UsersMutationRepositoryInterface {
        if (UsersMutationRepository.instance) {
            return UsersMutationRepository.instance;
        }

        UsersMutationRepository.instance = new UsersMutationRepository(writer);
        return UsersMutationRepository.instance;
    }

    async new(data: Omit<Doc<"users">, "_id" | "_creationTime">): Promise<Id<"users">> {
        return this.db.insert("users", data);
    }

    async patch(id: Id<"users">, data: Partial<Doc<"users">>): Promise<void> {
        return this.db.patch(id, data);
    }

    async delete(id: Id<"users">): Promise<void> {
        return this.db.delete(id);
    }
}
