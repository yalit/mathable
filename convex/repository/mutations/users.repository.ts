import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {GenericDatabaseWriter} from "convex/server";
import type {MutationRepositoryInterface} from "../repositories.interface.ts";
import type {SessionId} from "convex-helpers/server/sessions";

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

    async new(data: Partial<Doc<"users">>): Promise<Id<"users">> {
        type correctType = { name: string; sessionId: SessionId };
        const isCorrectType = (obj: object): obj is correctType => {
            return "name" in obj && typeof obj.name === "string" && "sessionId" in obj && typeof obj.sessionId === "string";
        };
        if (!isCorrectType(data)) {
            throw new Error("Invalid data for creating a new user");
        }

        return this.db.insert("users", { name: data.name, sessionId: data.sessionId });
    }

    async patch(user: Doc<"users">, data: Partial<Doc<"users">>): Promise<void> {
        return this.db.patch(user._id, data);
    }

    async delete(id: Id<"users">): Promise<void> {
        return this.db.delete(id);
    }
}
