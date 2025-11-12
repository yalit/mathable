import type { Id } from "../../_generated/dataModel";
import {appMutation, SessionArgs} from "../../middleware/app.middleware.ts";
import { v } from "convex/values";
import { UsersMutationRepository } from "../../repository/mutations/users.repository.ts";
import { UsersQueryRepository } from "../../repository/query/users.repository.ts";
import { userFromDoc, createUser } from "../../domain/models/factory/user.factory.ts";

export const set = appMutation({
  visibility: "internal", security:"internal",
  args: {...SessionArgs, name: v.string() },
  handler: async (ctx, args): Promise<Id<"users"> | null> => {
    if (ctx.user?.id) {
      const userDoc = await UsersQueryRepository.instance.find(ctx.user.id);
      if (userDoc) {
        const user = userFromDoc(userDoc);
        user.changeName(args.name);
        await UsersMutationRepository.instance.save(user);
      }
      return ctx.user.id;
    } else {
      const user = createUser(args.sessionId, args.name);
      return await UsersMutationRepository.instance.save(user);
    }
  },
});
