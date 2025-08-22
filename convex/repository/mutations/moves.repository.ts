import type { GenericDatabaseWriter } from "convex/server";
import type { DataModel, Doc, Id } from "../../_generated/dataModel";
import type { MutationRepositoryInterface } from "../repositories.interface";

export interface MovesMutationRepositoryInterface
  extends MutationRepositoryInterface<"moves"> {}

export class MovesMutationRepository
  implements MovesMutationRepositoryInterface
{
  static instance: MovesMutationRepositoryInterface;
  private db: GenericDatabaseWriter<DataModel>;

  static create(
    db: GenericDatabaseWriter<DataModel>,
  ): MovesMutationRepositoryInterface {
    if (!MovesMutationRepository.instance) {
      MovesMutationRepository.instance = new MovesMutationRepository(db);
    }
    return MovesMutationRepository.instance;
  }

  private constructor(db: GenericDatabaseWriter<DataModel>) {
    this.db = db;
  }

  async new(
    data: Omit<Doc<"moves">, "_id" | "_creationTime">,
  ): Promise<Id<"moves">> {
    return this.db.insert("moves", data);
  }

  async patch(id: Id<"moves">, data: Partial<Doc<"moves">>): Promise<void> {
    this.db.patch(id, data);
  }

  async delete(id: Id<"moves">): Promise<void> {
    this.db.delete(id);
  }
}
