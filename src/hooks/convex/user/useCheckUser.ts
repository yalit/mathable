import {useSessionMutation} from "convex-helpers/react/sessions";
import {api} from "@cvx/_generated/api";

export function useCheckUser(): void {
     const checkUser = useSessionMutation(api.controllers.user.mutations.createUser)

     checkUser().then(_ => console.log("User checked"))
}