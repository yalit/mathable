import type { Doc } from "../_generated/dataModel";
import { queryWithSession } from "../middleware/sessions";
import { SessionIdArg } from "convex-helpers/server/sessions";

export const getForSession = queryWithSession({
  args: SessionIdArg,
  handler: async (ctx, _): Promise<Doc<"users"> | null> => {
    return await ctx.db
      .query("users")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", ctx.sessionId))
      .unique();
  },
});
