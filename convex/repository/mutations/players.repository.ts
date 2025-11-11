import type {GenericDatabaseWriter} from "convex/server";
import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {MutationRepositoryInterface} from "../../repository/repositories.interface.ts";
import type {Player} from "../../domain/models/Player";

export interface PlayersMutationRepositoryInterface extends MutationRepositoryInterface<"players"> {
    save(player: Player): Promise<Id<"players">>;
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

    async delete(id: Id<"players">): Promise<void> {
        return this.db.delete(id);
    }

    async save(player: Player): Promise<Id<"players">> {
        const docData = {
            gameId: player.gameId,
            userId: player.userId,
            name: player.name,
            token: player.token,
            current: player.current,
            score: player.score,
            owner: player.owner,
            order: player.order
        };

        if (player.id === null) {
            // Insert new player - omit _id and _creationTime
            return await this.db.insert("players", docData as Omit<Doc<"players">, "_id" | "_creationTime">);
        } else {
            // Update existing player - patch all fields
            await this.db.patch(player.id, docData);
            return player.id;
        }
    }
}
