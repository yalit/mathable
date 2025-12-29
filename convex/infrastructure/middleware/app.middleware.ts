import {type SessionId, vSessionId} from "convex-helpers/server/sessions";
import type {PropertyValidators, Validator} from "convex/values";
import type {
    ArgsArrayForOptionalValidator,
    ArgsArrayToObject,
    DefaultArgsForOptionalValidator, GenericMutationCtx,
    GenericQueryCtx, RegisteredMutation, RegisteredQuery,
    ReturnValueForOptionalValidator
} from "convex/server";
import type {DataModel} from "../../_generated/dataModel";
import type {ServiceContainer} from "../config/ServiceContainer.ts";
import {internalMutation, internalQuery, mutation, query} from "../../_generated/server";
import type {User} from "../../domain/models/User.ts";
import {createContainer} from "../ContainerFactory.ts";

/*
export const withSessionQuery = customQuery(withContainerQuery, {
    args: SessionIdArg,
    input: async (ctx, {sessionId}) => {
        const user = await UsersQueryRepository.instance.findBySessionId(sessionId);
        return {ctx: {...ctx, user, sessionId}, args: {}};
    },
});
*/

// from https://medium.com/@mutabazialleluia/after-struggling-for-hours-heres-how-i-finally-created-a-typed-secure-wrapper-for-convex-queries-78144d680047
// Public or internal visibility for the query
type FunctionVisibility = "public" | "internal";
type SecurityLevel = "public" | "secure" | "internal"

export const SessionArgs = {sessionId: vSessionId}

export interface AppQueryCtx extends GenericQueryCtx<DataModel> {
    container: ServiceContainer;
    sessionId?: SessionId | null,
    user?: User | null,
}

export interface AppMutationCtx extends GenericMutationCtx<DataModel> {
    container: ServiceContainer;
}

export const appQuery = <
    Visibility extends FunctionVisibility,
    Security extends SecurityLevel,
    ArgsValidator extends PropertyValidators | Validator<any, "required", any> | void,
    ReturnsValidator extends PropertyValidators | Validator<any, "required", any> | void,
    ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator> = any,
    ArgsArray extends ArgsArrayForOptionalValidator<ArgsValidator> = DefaultArgsForOptionalValidator<ArgsValidator>,
>(
    props: {
        visibility: Visibility;
        security: Security,
        args?: ArgsValidator;
        returns?: ReturnsValidator;
        handler: (
            ctx: AppQueryCtx,
            ...args: ArgsArray
        ) => ReturnValue;
    },
) => {
    // Dynamically choose query or internalQuery based on face
    const fn = (props.visibility === "public"
        ? query
        : internalQuery) as any as (query: {
        args?: ArgsValidator;
        returns?: ReturnsValidator;
        handler: (
            ctx: GenericQueryCtx<DataModel>,
            ...args: ArgsArray
        ) => Promise<ReturnValue>;
    }) => RegisteredQuery<Visibility, ArgsArrayToObject<ArgsArray>, ReturnValue>;

    return fn({
        args: props.args,
        returns: props.returns,
        handler: async (ctx, ...args) => {
            const container = createContainer(ctx)

            if (props.security === "public" || props.security === "internal") {
                return props.handler({...ctx, container}, ...args);
            }

            return props.handler({...ctx, container}, ...args);
        },
    });
};

export interface AppMutationCtx extends GenericMutationCtx<DataModel> {
    container: ServiceContainer;
    sessionId?: SessionId,
    user?: User,
}

export const appMutation = <
    Visibility extends FunctionVisibility,
    Security extends SecurityLevel,
    ArgsValidator extends PropertyValidators | Validator<any, "required", any> | void,
    ReturnsValidator extends PropertyValidators | Validator<any, "required", any> | void,
    ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator> = any,
    ArgsArray extends ArgsArrayForOptionalValidator<ArgsValidator> = DefaultArgsForOptionalValidator<ArgsValidator>,
>(
    props: {
        visibility: Visibility;
        security: Security,
        args?: ArgsValidator;
        returns?: ReturnsValidator;
        handler: (
            ctx: AppMutationCtx,
            ...args: ArgsArray
        ) => ReturnValue;
    },
) => {
    // Dynamically choose query or internalQuery based on face
    const fn = (props.visibility === "public"
        ? mutation
        : internalMutation) as any as (mutation: {
        args?: ArgsValidator;
        returns?: ReturnsValidator;
        handler: (
            ctx: GenericMutationCtx<DataModel>,
            ...args: ArgsArray
        ) => Promise<ReturnValue>;
    }) => RegisteredMutation<Visibility, ArgsArrayToObject<ArgsArray>, ReturnValue>;

    return fn({
        args: props.args,
        returns: props.returns,
        handler: async (ctx, ...args) => {
            const container = createContainer(ctx)

            if (props.security === "public" ||  props.security === "internal") {
                return props.handler({...ctx, container}, ...args);
            }

            return props.handler({...ctx, container}, ...args);
        },
    });
};

