import type {Game} from "@context/model/game.ts";
import {useEffect, useState} from "react";
import {api} from "@cvx/_generated/api";
import {useFetchFromBackendGameActions} from "@hooks/convex/game/useFetchFromBackendGameActions.tsx";
import {useSessionQuery} from "convex-helpers/react/sessions";

export function useFetchOngoingGamesForSession():  Game[] {
    const {toGames} = useFetchFromBackendGameActions()
    const [ongoingGamesForSession, setOngoingGamesForSession] = useState<Game[]>([])
    const sessionGames = useSessionQuery(
        api.controllers.game.queries.getNonFinishedForSession,
    );

    useEffect(() => {
        if (!sessionGames) return

        toGames(sessionGames).then(g => setOngoingGamesForSession(g))
    }, [sessionGames, toGames]);

    return ongoingGamesForSession
}