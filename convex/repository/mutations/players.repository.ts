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

    async new(data: Partial<Doc<"players">>): Promise<Id<"players">> {
        type PlayerNewType = {
            gameId: Id<"games">,
            token: string,
            name: string,
            current: boolean,
            score: number,
            owner: boolean,
            order: number,
            userId: Id<"users">
        }
        const isValid = (obj: object): obj is PlayerNewType => {
            return 'gameId' in obj && 'token' in obj && 'name' in obj && 'current' in obj && 'score' in obj && 'owner' in obj && 'order' in obj && 'userId' in obj
                && typeof obj.gameId === 'string'
                && typeof obj.token === 'string'
                && typeof obj.name === 'string'
                && typeof obj.current === 'boolean'
                && typeof obj.score === 'number'
                && typeof obj.owner === 'boolean'
                && typeof obj.order === 'number'
                && typeof obj.userId === 'string';
        }
        if (!isValid(data)) {
            throw new Error("Invalid data for creating a new player");
        }

        return this.db.insert("players", {
            gameId: data.gameId,
            token: data.token,
            name: data.name,
            current: data.current,
            score: data.score,
            owner: data.owner,
            order: data.order,
            userId: data.userId
        });
    }

    async patch(doc: Doc<"players">, data: Partial<Doc<"players">>): Promise<void> {
        return this.db.patch(doc._id, data);
    }

    async delete(id: Id<"players">): Promise<void> {
        return this.db.delete(id);
    }
}
