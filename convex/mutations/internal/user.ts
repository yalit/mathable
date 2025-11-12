import type { Id } from "../../_generated/dataModel";
import {appMutation, SessionArgs} from "../../middleware/app.middleware.ts";
import { v } from "convex/values";
import type { UsersMutationRepositoryInterface } from "../../repository/mutations/users.repository.ts";
import type { UsersQueryRepositoryInterface } from "../../repository/query/users.repository.ts";
import { userFromDoc, createUser } from "../../domain/models/factory/user.factory.ts";

export const set = appMutation({
  visibility: "internal", security:"internal",
  args: {...SessionArgs, name: v.string() },
  handler: async (ctx, args): Promise<Id<"users"> | null> => {
    const usersQueryRepository: UsersQueryRepositoryInterface = ctx.container.get("UsersQueryRepositoryInterface");
    const usersMutationRepository: UsersMutationRepositoryInterface = ctx.container.get("UsersMutationRepositoryInterface");

    if (ctx.user?.id) {
      const userDoc = await usersQueryRepository.find(ctx.user.id);
      if (userDoc) {
        const user = userFromDoc(userDoc);
        user.changeName(args.name);
        await usersMutationRepository.save(user);
      }
      return ctx.user.id;
    } else {
      const user = createUser(args.sessionId, args.name);
      return await usersMutationRepository.save(user);
    }
  },
});
