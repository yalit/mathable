import { createPlayer } from "../../../src/context/factories/playerFactory";
import { UUID } from "../../../src/context/factories/uuidFactory";
import type { Id } from "../../_generated/dataModel";
import { internalMutation } from "../../_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: { gameId: v.id("games"), name: v.string() },
  handler: async (ctx, args): Promise<Id<"players">> => {
    const player = createPlayer(args.name);
    return await ctx.db.insert("players", {
      gameId: args.gameId,
      token: UUID(),
      name: player.name,
      current: player.current,
      score: player.score,
      owner: false,
      order: 0,
    });
  },
});
