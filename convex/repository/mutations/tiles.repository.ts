import type { MutationRepositoryInterface } from "../repositories.interface.ts";
import type { GenericDatabaseWriter } from "convex/server";
import type { DataModel, Doc, Id } from "../../_generated/dataModel";

export interface TilesMutationRepositoryInterface
  extends MutationRepositoryInterface<"tiles"> {}

export class TilesMutationRepository
  implements TilesMutationRepositoryInterface
{
  static instance: TilesMutationRepository;
  private db: GenericDatabaseWriter<DataModel>;

  static create(
    db: GenericDatabaseWriter<DataModel>,
  ): TilesMutationRepositoryInterface {
    if (!TilesMutationRepository.instance) {
      TilesMutationRepository.instance = new TilesMutationRepository(db);
    }
    return TilesMutationRepository.instance;
  }

  private constructor(db: GenericDatabaseWriter<DataModel>) {
    this.db = db;
  }

  async new(
    data: Omit<Doc<"tiles">, "_id" | "_creationTime">,
  ): Promise<Id<"tiles">> {
    return this.db.insert("tiles", data);
  }

  async patch(id: Id<"tiles">, tile: Partial<Doc<"tiles">>): Promise<void> {
    await this.db.patch(id, tile);
  }

  async delete(id: Id<"tiles">): Promise<void> {
    await this.db.delete(id);
  }
}
