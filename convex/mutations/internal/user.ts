import type { Id } from "../../_generated/dataModel";
import { withSessionInternalMutation } from "../../middleware/sessions";
import { v } from "convex/values";
import { UsersMutationRepository } from "../../repository/mutations/users.repository.ts";

export const set = withSessionInternalMutation({
  args: { name: v.string() },
  handler: async (ctx, args): Promise<Id<"users"> | null> => {
    if (ctx.user) {
      await UsersMutationRepository.instance.patch(ctx.user._id, args);
      return ctx.user._id;
    } else {
      return await UsersMutationRepository.instance.new({
        name: args.name,
        sessionId: ctx.sessionId,
      });
    }
  },
});
