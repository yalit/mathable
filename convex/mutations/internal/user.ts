import type { Id } from "../../_generated/dataModel";
import { internalMutationWithSession } from "../../middleware/sessions";
import { v } from "convex/values";

export const set = internalMutationWithSession({
  args: { name: v.string() },
  handler: async (ctx, { name }): Promise<Id<"users"> | null> => {
    if (ctx.user) {
      await ctx.db.patch(ctx.user._id, { name });
      return ctx.user._id;
    } else {
      return await ctx.db.insert("users", { name, sessionId: ctx.sessionId });
    }
  },
});
