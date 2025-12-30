import type {DataModel} from "../../_generated/dataModel";
import type {GenericDatabaseWriter} from "convex/server";
import type {DocData, MutationRepositoryInterface} from "../repositories.interface.ts";
import type {User} from "../../domain/models/User";
import {userFromDoc} from "../../domain/models/factory/user.factory.ts";

export interface UsersMutationRepositoryInterface extends MutationRepositoryInterface<User, "users"> {}

export class UsersMutationRepository implements UsersMutationRepositoryInterface {
    static instance: UsersMutationRepository;
    private db: GenericDatabaseWriter<DataModel>;

    constructor(writer: GenericDatabaseWriter<DataModel>) {
        this.db = writer;
    }

    static create(writer: GenericDatabaseWriter<DataModel>): UsersMutationRepositoryInterface {
        if (!UsersMutationRepository.instance) {
            UsersMutationRepository.instance = new UsersMutationRepository(writer);
        }
        return UsersMutationRepository.instance;
    }

    async delete(user: User): Promise<void> {
        return this.db.delete(user.id);
    }

    async new(data: DocData<"users">): Promise<User> {
        const userId = await this.db.insert("users", data)
        return userFromDoc({...data, _id:userId, _creationTime: 0})
    }

    async save(user: User): Promise<User> {
        const docData = {
            sessionId: user.sessionId,
            name: user.name
        };

        // Update existing user - patch all fields
        await this.db.patch(user.id, docData);
        return user;
    }
}
