import type { GenericDatabaseWriter } from "convex/server";
import type { DataModel, Doc, Id } from "../../_generated/dataModel";
import type { MutationRepositoryInterface } from "../repositories.interface";
import type { Move } from "../../domain/models/Move";

export interface MovesMutationRepositoryInterface
  extends MutationRepositoryInterface<"moves"> {
  save(move: Move): Promise<Id<"moves">>;
}

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

  async delete(id: Id<"moves">): Promise<void> {
    this.db.delete(id);
  }

  async save(move: Move): Promise<Id<"moves">> {
    const docData = move.toDoc();

    if (move.id === null) {
      // Insert new move - omit _id and _creationTime
      return await this.db.insert("moves", docData as Omit<Doc<"moves">, "_id" | "_creationTime">);
    } else {
      // Update existing move - patch all fields
      await this.db.patch(move.id, docData);
      return move.id;
    }
  }
}
