import type { Id } from "../../_generated/dataModel";
import { withSessionInternalMutation } from "../../middleware/sessions";
import { v } from "convex/values";
import { UsersMutationRepository } from "../../repository/mutations/users.repository.ts";
import { UsersQueryRepository } from "../../repository/query/users.repository.ts";
import { userFromDoc, createUser } from "../../domain/models/factory/user.factory.ts";

export const set = withSessionInternalMutation({
  args: { name: v.string() },
  handler: async (ctx, args): Promise<Id<"users"> | null> => {
    if (ctx.user) {
      const userDoc = await UsersQueryRepository.instance.find(ctx.user._id);
      if (userDoc) {
        const user = userFromDoc(userDoc);
        user.changeName(args.name);
        await UsersMutationRepository.instance.save(user);
      }
      return ctx.user._id;
    } else {
      const user = createUser(ctx.sessionId, args.name);
      return await UsersMutationRepository.instance.save(user);
    }
  },
});
