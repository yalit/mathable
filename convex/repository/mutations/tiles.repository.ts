import type {DocData, MutationRepositoryInterface} from "../repositories.interface.ts";
import type { GenericDatabaseWriter } from "convex/server";
import type { DataModel} from "../../_generated/dataModel";
import type { Tile } from "../../domain/models/Tile";
import {tileFromDoc} from "../../domain/models/factory/tile.factory.ts";

export interface TilesMutationRepositoryInterface
  extends MutationRepositoryInterface<Tile, "tiles"> {}

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

  async delete(tile: Tile): Promise<void> {
    await this.db.delete(tile.id);
  }

  async new(data: DocData<"tiles">): Promise<Tile> {
    const tileId = await this.db.insert("tiles", data)
    return tileFromDoc({...data, _id:tileId,_creationTime:0})
  }

  async save(tile: Tile): Promise<Tile> {
    const docData = {
      gameId: tile.gameId,
      value: tile.value,
      location: tile.location,
      playerId: tile.playerId,
      cellId: tile.cellId
    };

    // Update existing tile - patch all fields
    await this.db.patch(tile.id, docData);
    return tile;
  }
}
