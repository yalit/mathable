import { queryWithSession } from "../middleware/sessions";
import { playerSchema, type Player } from "../../src/context/model/player";
import { query } from "../_generated/server";
import { getPlayerTiles } from "../helpers/player";
import { v } from "convex/values";
import { SessionIdArg } from "convex-helpers/server/sessions";
import { api } from "../_generated/api";

export const get = query({
  args: { playerToken: v.string() },
  handler: async (ctx, args): Promise<Player | null> => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_token", (q) => q.eq("token", args.playerToken))
      .unique();

    if (!player) {
      return null;
    }

    const tiles = await getPlayerTiles(player, ctx);

    return playerSchema.parse({
      ...player,
      tiles,
    });
  },
});
