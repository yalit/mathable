import { playerSchema, type Player } from "../../src/context/model/player";
import { v } from "convex/values";
import type {TilesQueryRepositoryInterface} from "../repository/query/tiles.repository.ts";
import {appQuery} from "../middleware/app.middleware.ts";

export const get = appQuery({
  visibility: "public", security: "public",
  args: { playerToken: v.string() },
  handler: async (ctx, args): Promise<Player | null> => {
    const playersQueryRepository = ctx.container.get("PlayersQueryRepositoryInterface");
    const tilesQueryRepository: TilesQueryRepositoryInterface = ctx.container.get("TilesQueryRepositoryInterface");

    const player = await playersQueryRepository.findByToken(args.playerToken);

    if (!player) {
      return null;
    }

    const tiles = await tilesQueryRepository.findByPlayer(player._id)

    return playerSchema.parse({
      ...player,
      tiles,
    });
  },
});
