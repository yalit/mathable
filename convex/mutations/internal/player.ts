import { internal } from "../..//_generated/api";
import { createPlayer } from "../../../src/context/factories/playerFactory";
import { UUID } from "../../../src/context/factories/uuidFactory";
import type { Id } from "../../_generated/dataModel";
import { v } from "convex/values";
import { vSessionId } from "convex-helpers/server/sessions";
import { internalMutationWithSession } from "../../middleware/sessions";

export const create = internalMutationWithSession({
  args: { gameId: v.id("games"), name: v.string(), sessionId: vSessionId },
  handler: async (ctx, { gameId, name }): Promise<Id<"players">> => {
    const player = createPlayer(name);
    let userId = ctx.user?._id ?? null;
    if (!ctx.user) {
      userId = await ctx.runMutation(internal.mutations.internal.user.set, {
        name,
        sessionId: ctx.sessionId,
      });
    }
    return await ctx.db.insert("players", {
      gameId: gameId,
      token: UUID(),
      name: player.name,
      current: player.current,
      score: player.score,
      owner: false,
      order: 0,
      userId: userId!,
    });
  },
});
