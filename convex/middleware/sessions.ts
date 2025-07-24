import {
  action,
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from "../_generated/server";
import {
  customAction,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import {
  runSessionFunctions,
  type SessionId,
  SessionIdArg,
} from "convex-helpers/server/sessions";

async function getUser(ctx: QueryCtx, sessionId: SessionId) {
  return await ctx.db
    .query("users")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
    .unique();
}

export const queryWithSession = customQuery(query, {
  args: SessionIdArg,
  input: async (ctx, { sessionId }) => {
    const user = await getUser(ctx, sessionId);
    return { ctx: { ...ctx, user, sessionId }, args: {} };
  },
});

export const mutationWithSession = customMutation(mutation, {
  args: SessionIdArg,
  input: async (ctx, { sessionId }) => {
    const user = await getUser(ctx, sessionId);
    return { ctx: { ...ctx, user, sessionId }, args: {} };
  },
});

export const internalMutationWithSession = customMutation(internalMutation, {
  args: SessionIdArg,
  input: async (ctx, { sessionId }) => {
    const user = await getUser(ctx, sessionId);
    return { ctx: { ...ctx, user, sessionId }, args: {} };
  },
});

export const actionWithSession = customAction(action, {
  args: SessionIdArg,
  input: async (ctx, { sessionId }) => {
    return {
      ctx: {
        ...ctx,
        ...runSessionFunctions(ctx, sessionId),
        sessionId,
      },
      args: {},
    };
  },
});
