import type { DataModel } from "../../_generated/dataModel";
import type {DocData, MutationRepositoryInterface} from "../repositories.interface.ts";
import type { GenericDatabaseWriter } from "convex/server";
import type { Cell } from "../../domain/models/Cell";
import {cellFromDoc} from "../../domain/models/factory/cell.factory.ts";

export interface CellsMutationRepositoryInterface
  extends MutationRepositoryInterface<Cell, "cells"> {
}

export class CellsMutationRepository
  implements CellsMutationRepositoryInterface
{
  static instance: CellsMutationRepository;
  private db: GenericDatabaseWriter<DataModel>;

  static create(db: GenericDatabaseWriter<DataModel>): CellsMutationRepositoryInterface {
    if (!CellsMutationRepository.instance) {
      CellsMutationRepository.instance = new CellsMutationRepository(db);
    }
    return CellsMutationRepository.instance
  }

  private constructor(db: GenericDatabaseWriter<DataModel>) {
    this.db = db;
  }

  async delete(cell: Cell): Promise<void> {
    await this.db.delete(cell.id);
  }

  async new(data: DocData<"cells">): Promise<Cell> {
    const cellId = await this.db.insert("cells", data);
    return cellFromDoc({...data, _id: cellId, _creationTime: 0})
  }

  async save(cell: Cell): Promise<Cell> {
    const docData = cell.toDoc();

    // Update existing cell - patch all fields
    await this.db.patch(cell.id, docData);
    return cell;
  }
}

