import type { DataModel, Doc, Id } from "../../_generated/dataModel";
import type { MutationRepositoryInterface } from "../repositories.interface.ts";
import type { GenericDatabaseWriter } from "convex/server";

export interface CellsMutationRepositoryInterface
  extends MutationRepositoryInterface<"cells"> {}

export class CellsMutationRepository
  implements CellsMutationRepositoryInterface
{
  static instance: CellsMutationRepository;
  private db: GenericDatabaseWriter<DataModel>;

  static create(db: GenericDatabaseWriter<DataModel>): void {
    if (!CellsMutationRepository.instance) {
      CellsMutationRepository.instance = new CellsMutationRepository(db);
    }
  }

  private constructor(db: GenericDatabaseWriter<DataModel>) {
    this.db = db;
  }

  async new(
    data: Omit<Doc<"cells">, "_id" | "_creationTime">,
  ): Promise<Id<"cells">> {
    return this.db.insert("cells", data);
  }

  async patch(id: Id<"cells">, cell: Partial<Doc<"cells">>): Promise<void> {
    await this.db.patch(id, cell);
  }

  async delete(id: Id<"cells">): Promise<void> {
    await this.db.delete(id);
  }
}

