import {useEffect, useState} from "react";
import {api} from "@cvx/_generated/api";
import {useSessionQuery} from "convex-helpers/react/sessions";

export type OngoingGame = {
    id: string;
    status: string;
    currentTurn: number;
    players: Array<OngoingGamePlayer>;
    token: string
}

export type OngoingGamePlayer = {
    token: string
    userId: string
    name: string;
    score: number;
}

export function useFetchOngoingGamesForSession():  OngoingGame[] {
    const [ongoingGamesForSession, setOngoingGamesForSession] = useState<OngoingGame[]>([])
    const sessionGames = useSessionQuery(
        api.controllers.game.queries.getNonFinishedForSession,
    );

    useEffect(() => {
        if (!sessionGames) return
        setOngoingGamesForSession(sessionGames)
    }, [sessionGames]);

    return ongoingGamesForSession
}