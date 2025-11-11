import type { DataModel, Doc, Id } from "../../_generated/dataModel";
import type { MutationRepositoryInterface } from "../repositories.interface.ts";
import type { GenericDatabaseWriter } from "convex/server";
import type { Cell } from "../../domain/models/Cell";

export interface CellsMutationRepositoryInterface
  extends MutationRepositoryInterface<"cells"> {
  save(cell: Cell): Promise<Id<"cells">>;
}

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

  async delete(id: Id<"cells">): Promise<void> {
    await this.db.delete(id);
  }

  async save(cell: Cell): Promise<Id<"cells">> {
    const docData = cell.toDoc();

    if (cell.id === null) {
      // Insert new cell - omit _id and _creationTime
      return await this.db.insert("cells", docData as Omit<Doc<"cells">, "_id" | "_creationTime">);
    } else {
      // Update existing cell - patch all fields
      await this.db.patch(cell.id, docData);
      return cell.id;
    }
  }
}

