import type {User} from "@cvx/domain/models/User.ts";
import {useSessionQuery} from "convex-helpers/react/sessions";
import {api} from "@cvx/_generated/api";
import {useEffect, useState} from "react";

export function useFetchSessionUser(): User | null {
    const [user, setUser] = useState<User | null>(null);

    const convexUser = useSessionQuery(api.controllers.user.queries.getForSession);

    useEffect(() => {
        if (!convexUser) return

        setUser(convexUser)
    }, [convexUser])

    return user
}