import type { GenericDatabaseWriter } from "convex/server";
import type { DataModel } from "../../_generated/dataModel";
import type {
  DocData,
  MutationRepositoryInterface,
} from "../../repository/repositories.interface.ts";
import type { Player } from "../../domain/models/Player";
import { playerFromDoc } from "../../domain/models/factory/player.factory.ts";
import type { Game } from "../../domain/models/Game.ts";
import { UUID } from "../../domain/models/factory/uuid.factory.ts";
import type { User } from "../../domain/models/User.ts";

export interface PlayersMutationRepositoryInterface
  extends MutationRepositoryInterface<Player, "players"> {
  newFromName(game: Game, user: User, name: string): Promise<Player>;
}

export class PlayersMutationRepository
  implements PlayersMutationRepositoryInterface
{
  static instance: PlayersMutationRepository;
  private db: GenericDatabaseWriter<DataModel>;

  private constructor(db: GenericDatabaseWriter<DataModel>) {
    this.db = db;
  }

  static create(
    db: GenericDatabaseWriter<DataModel>,
  ): PlayersMutationRepositoryInterface {
    if (!PlayersMutationRepository.instance) {
      PlayersMutationRepository.instance = new PlayersMutationRepository(db);
    }
    return PlayersMutationRepository.instance;
  }

  async delete(player: Player): Promise<void> {
    return this.db.delete(player.id);
  }

  async newFromName(game: Game, user: User, name: string): Promise<Player> {
    return this.new({
      gameId: game.id,
      userId: user.id,
      owner: true,
      name: name,
      token: UUID(),
      current: false,
      score: 0,
      order: 0,
    });
  }

  async new(data: DocData<"players">): Promise<Player> {
    const id = await this.db.insert("players", data);
    return playerFromDoc({ ...data, _id: id, _creationTime: 0 });
  }

  async save(player: Player): Promise<Player> {
    const docData = {
      gameId: player.gameId,
      userId: player.userId,
      name: player.name,
      token: player.token,
      current: player.current,
      score: player.score,
      owner: player.owner,
      order: player.order,
    };

    // Update existing player - patch all fields
    await this.db.patch(player.id, docData);
    return player;
  }
}
