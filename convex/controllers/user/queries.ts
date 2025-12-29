import {appQuery, SessionArgs} from "../../middleware/app.middleware.ts";
import type {User} from "../../domain/models/User.ts";

export const getForSession = appQuery({
    visibility: "public", security: "secure",
    args: SessionArgs,
    handler: async (ctx): Promise<User | null> => {
        return ctx.user ?? null
    },
});
