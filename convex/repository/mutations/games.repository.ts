import type {DocData, MutationRepositoryInterface} from "../repositories.interface.ts";
import type {GenericDatabaseWriter} from "convex/server";
import type {DataModel} from "../../_generated/dataModel";
import type {Game} from "../../domain/models/Game";
import {gameFromDoc} from "../../domain/models/factory/game.factory.ts";

export interface GamesMutationRepositoryInterface extends MutationRepositoryInterface<Game, "games"> {}


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

    async delete(game: Game): Promise<void> {
        await this.db.delete(game.id);
    }

    async new(data: DocData<"games">): Promise<Game> {
        const gameId = await this.db.insert("games", data);
        return gameFromDoc({...data, _id: gameId, _creationTime: 0})
    }

    async save(game: Game): Promise<Game> {
        const docData = {
            token: game.token,
            status: game.status,
            currentTurn: game.currentTurn,
            winner: game.winner
        };

        // Update existing game - patch all fields
        await this.db.patch(game.id, docData);
        return game;
    }
}