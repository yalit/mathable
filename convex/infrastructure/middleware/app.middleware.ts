import type {DataModel} from "../../_generated/dataModel";
import { vSessionId, type SessionId, } from "convex-helpers/server/sessions";
import type {GenericMutationCtx, GenericQueryCtx} from "convex/server";
import type {ServiceContainer} from "../config/ServiceContainer";
import type {User} from "../../domain/models/User";
import type {UsersQueryRepositoryInterface} from "../../repository/query/users.repository";
import type {UsersMutationRepositoryInterface} from "../../repository/mutations/users.repository";
import {createContainer} from "../ContainerFactory";
import {mutation, query} from "../../_generated/server";
import { customMutation, customQuery, } from "convex-helpers/server/customFunctions";
import {v} from "convex/values";

export const SessionArgs = {sessionId: vSessionId};

type BaseCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
type AppSecurityCtx = {
    container: ServiceContainer;
    sessionId: SessionId;
    user: User | null;
}
type AppCtx<C extends BaseCtx> = C & AppSecurityCtx
export type AppQueryCtx = AppCtx<GenericQueryCtx<DataModel>>;
export type AppMutationCtx = AppCtx<GenericMutationCtx<DataModel>>;

type SessionAppArgs = { sessionId?: string }

export const appQuery = customQuery(query, {
    args: {sessionId: v.optional(vSessionId)},
    input: async (ctx, args) => {
        const securityCtx = await getCtxWithContainerAndSecurity<GenericQueryCtx<DataModel>>(ctx, args)
        return {ctx: securityCtx, args};
    },
});

export const appMutation = customMutation(mutation, {
    args: {sessionId: v.optional(vSessionId)},
    input: async (ctx, args) => {
        const securityCtx = await getCtxWithContainerAndSecurity<GenericMutationCtx<DataModel>>(ctx, args)
        if (!securityCtx.user && args.sessionId) {
            const usersMutation: UsersMutationRepositoryInterface = securityCtx.container.get(
                "UsersMutationRepositoryInterface",
            );
            securityCtx.user = await usersMutation.new({sessionId: args.sessionId});
        }
        return {ctx: securityCtx, args};
    },
});

const getCtxWithContainerAndSecurity = async <C extends BaseCtx>(
    ctx: C,
    args: SessionAppArgs,
): Promise<AppCtx<C>> => {
    const container = createContainer(ctx);

    const {sessionId} = args;
    let user = null;
    if (sessionId) {
        user = await getUser(container, sessionId as SessionId)
    }

    return { ...ctx, container, user, sessionId: (sessionId as SessionId) ?? "" };
};

const getUser = async (
    container: ServiceContainer,
    sessionId: SessionId,
): Promise<User | null> => {
    const usersQuery: UsersQueryRepositoryInterface = container.get(
        "UsersQueryRepositoryInterface",
    );
    return await usersQuery.findBySessionId(sessionId);
};
