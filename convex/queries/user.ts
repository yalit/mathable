import type { Doc } from "../_generated/dataModel";
import { withSessionQuery } from "../middleware/sessions";
import { SessionIdArg } from "convex-helpers/server/sessions";
import {UsersQueryRepository} from "../repository/query/users.repository.ts";

export const getForSession = withSessionQuery({
  args: SessionIdArg,
  handler: async (ctx): Promise<Doc<"users"> | null> => {
    return await UsersQueryRepository.instance.findBySessionId(ctx.sessionId);
  },
});
