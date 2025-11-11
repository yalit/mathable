import type { MutationRepositoryInterface } from "../repositories.interface.ts";
import type { GenericDatabaseWriter } from "convex/server";
import type { DataModel, Doc, Id } from "../../_generated/dataModel";
import type { Tile } from "../../domain/models/Tile";

export interface TilesMutationRepositoryInterface
  extends MutationRepositoryInterface<"tiles"> {
  save(tile: Tile): Promise<Id<"tiles">>;
}

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

  async save(tile: Tile): Promise<Id<"tiles">> {
    const docData = {
      gameId: tile.gameId,
      value: tile.value,
      location: tile.location,
      playerId: tile.playerId,
      cellId: tile.cellId
    };

    if (tile.id === null) {
      // Insert new tile - omit _id and _creationTime
      return await this.db.insert("tiles", docData as Omit<Doc<"tiles">, "_id" | "_creationTime">);
    } else {
      // Update existing tile - patch all fields
      await this.db.patch(tile.id, docData);
      return tile.id;
    }
  }

  async delete(id: Id<"tiles">): Promise<void> {
    await this.db.delete(id);
  }
}
