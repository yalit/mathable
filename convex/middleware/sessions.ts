import {customMutation, customQuery,} from "convex-helpers/server/customFunctions";
import {SessionIdArg,} from "convex-helpers/server/sessions";
import {
    withRepositoryInternalMutation,
    withRepositoryMutation,
    withRepositoryQuery
} from "./repository.middleware.ts";
import {UsersQueryRepository} from "../repository/query/users.repository.ts";

export const withSessionQuery = customQuery(withRepositoryQuery, {
    args: SessionIdArg,
    input: async (ctx, {sessionId}) => {
        const user = await UsersQueryRepository.instance.findBySessionId(sessionId);
        return {ctx: {...ctx, user, sessionId}, args: {}};
    },
});

export const withSessionMutation = customMutation(withRepositoryMutation, {
    args: SessionIdArg,
    input: async (ctx, {sessionId}) => {
        const user = await UsersQueryRepository.instance.findBySessionId(sessionId);
        return {ctx: {...ctx, user, sessionId}, args: {}};
    },
});

export const withSessionInternalMutation = customMutation(withRepositoryInternalMutation, {
    args: SessionIdArg,
    input: async (ctx, {sessionId}) => {
        const user = await UsersQueryRepository.instance.findBySessionId(sessionId);
        return {ctx: {...ctx, user, sessionId}, args: {}};
    },
});
