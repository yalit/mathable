import { playerSchema, type Player } from "../../src/context/model/player";
import { v } from "convex/values";
import {withRepositoryQuery} from "../middleware/repository.middleware.ts";
import {PlayersQueryRepository} from "../repository/query/players.repository.ts";
import {TilesQueryRepository} from "../repository/query/tiles.repository.ts";

export const get = withRepositoryQuery({
  args: { playerToken: v.string() },
  handler: async (_, args): Promise<Player | null> => {
    const player = await PlayersQueryRepository.instance.findByToken(args.playerToken);

    if (!player) {
      return null;
    }

    const tiles = await TilesQueryRepository.instance.findByPlayer(player._id)

    return playerSchema.parse({
      ...player,
      tiles,
    });
  },
});
