import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {GenericDatabaseWriter} from "convex/server";
import type {MutationRepositoryInterface} from "../repositories.interface.ts";
import type {User} from "../../domain/models/User";

export interface UsersMutationRepositoryInterface extends MutationRepositoryInterface<"users"> {
    save(user: User): Promise<Id<"users">>;
}

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

    async save(user: User): Promise<Id<"users">> {
        const docData = {
            sessionId: user.sessionId,
            name: user.name
        };

        if (user.id === null) {
            // Insert new user - omit _id and _creationTime
            return await this.db.insert("users", docData as Omit<Doc<"users">, "_id" | "_creationTime">);
        } else {
            // Update existing user - patch all fields
            await this.db.patch(user.id, docData);
            return user.id;
        }
    }

    async delete(id: Id<"users">): Promise<void> {
        return this.db.delete(id);
    }
}
