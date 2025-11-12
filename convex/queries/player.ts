import { playerSchema, type Player } from "../../src/context/model/player";
import { v } from "convex/values";
import {TilesQueryRepository} from "../repository/query/tiles.repository.ts";
import {appQuery} from "../middleware/app.middleware.ts";

export const get = appQuery({
  visibility: "public", security: "public",
  args: { playerToken: v.string() },
  handler: async (ctx, args): Promise<Player | null> => {
    const player = await ctx.container.get("PlayersQueryRepositoryInterface").findByToken(args.playerToken);

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
