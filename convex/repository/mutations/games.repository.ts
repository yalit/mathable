import type {MutationRepositoryInterface} from "../repositories.interface.ts";
import type {GenericDatabaseWriter} from "convex/server";
import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {Game} from "../../domain/models/Game";

export interface GamesMutationRepositoryInterface extends MutationRepositoryInterface<"games"> {
    save(game: Game): Promise<Id<"games">>;
}


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

    async delete(id: Id<"games">): Promise<void> {
        await this.db.delete(id);
    }

    async save(game: Game): Promise<Id<"games">> {
        const docData = {
            token: game.token,
            status: game.status,
            currentTurn: game.currentTurn,
            winner: game.winner
        };

        if (game.id === null) {
            // Insert new game - omit _id and _creationTime
            return await this.db.insert("games", docData as Omit<Doc<"games">, "_id" | "_creationTime">);
        } else {
            // Update existing game - patch all fields
            await this.db.patch(game.id, docData);
            return game.id;
        }
    }
}