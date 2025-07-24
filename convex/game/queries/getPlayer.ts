import { playerSchema, type Player } from "../../../src/context/model/player";
import { query } from "../../_generated/server";
import { getPlayerTiles } from "../../helpers/player";
import { v } from "convex/values";

export default query({
  args: { playerToken: v.string() },
  handler: async (ctx, args): Promise<Player | null> => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_token", (q) => q.eq("token", args.playerToken))
      .unique();

    console.log("found player", player);
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
