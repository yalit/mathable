import {appQuery, SessionArgs} from "../../infrastructure/middleware/app.middleware.ts";
import type {User} from "../../domain/models/User.ts";

export const getForSession = appQuery({
    args: SessionArgs,
    handler: async (ctx): Promise<User | null> => {
        return ctx.user ?? null
    },
});
