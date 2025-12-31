import {appMutation} from "../../infrastructure/middleware/app.middleware.ts";
import {SessionIdArg} from "convex-helpers/server/sessions";


export const createUser = appMutation({
    args: SessionIdArg,
    handler: async(): Promise<void> => {
        // user creation and check already made in the middleware...
        return
    }
})