import type {DataModel, Doc, Id} from "../../_generated/dataModel";
import type {GenericDatabaseReader} from "convex/server";
import type {QueryRepositoryInterface} from "../../repository/repositories.interface.ts";

export interface MovesQueryRepositoryInterface extends QueryRepositoryInterface<"moves"> {
    findAllForCurrentTurn: (game: Doc<"games">) => Promise<Doc<"moves">[]>;
}

export class MovesQueryRepository implements MovesQueryRepositoryInterface {
    static instance: MovesQueryRepository;
    private db: GenericDatabaseReader<DataModel>;

    constructor(db: GenericDatabaseReader<DataModel>) {
        this.db = db;
    }

    static create(db: GenericDatabaseReader<DataModel>): MovesQueryRepositoryInterface {
        if (MovesQueryRepository.instance) {
            return MovesQueryRepository.instance;
        }
        MovesQueryRepository.instance = new this(db);
        return MovesQueryRepository.instance;
    }

    async findAll(): Promise<Doc<"moves">[]> {
        return this.db.query("moves").collect();
    }

    async find(id: Id<"moves">): Promise<Doc<"moves"> | null> {
        return this.db.get(id);
    }

    async findAllForCurrentTurn(game: Doc<"games">): Promise<Doc<"moves">[]> {
        return this.db
            .query("moves")
            .withIndex("by_turn", (q) =>
                q.eq("gameId", game._id).eq("turn", game.currentTurn),
            )
            .order("desc")
            .collect();
    }
}