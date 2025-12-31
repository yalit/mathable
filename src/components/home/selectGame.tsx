import { useJoinGame } from "@hooks/useJoinGame";
import {
    type OngoingGame,
    type OngoingGamePlayer,
    useFetchOngoingGamesForSession
} from "@hooks/convex/game/useFetchOngoingGamesForSession.tsx";

export const SelectGame = () => {
    const sessionGames: OngoingGame[] = useFetchOngoingGamesForSession()
    const { joinGame } = useJoinGame();

    const rejoinGame = (game: OngoingGame, player: OngoingGamePlayer) => {
        joinGame(game.token, player.token);
    };

    console.log(sessionGames);
    return (
        <>
            {(sessionGames && sessionGames.length > 0) && (
                <div>
                    <div className="text-center font-semibold text-xl mb-5">
                        You've ongoing game(s)
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-3">
                        {sessionGames?.map((g) => (
                            <div
                                key={g.id}
                                className="overflow-hidden rounded border border-gray-100 w-[250px]"
                            >
                                <div className="p-3 mb-3 font-semibold text-center bg-orange-50/50">
                                    Status : {g.status}
                                </div>
                                <div className="px-5">
                                    <span className="font-semibold">Turn : </span>
                                    {g.currentTurn}
                                </div>
                                <div className="px-5">
                                    <span className="font-semibold">Players : </span>
                                    {g.players
                                        .map((p) => p.name + " (" + p.score + ")")
                                        .join(" / ")}
                                </div>
                                <div className="flex items-center gap-2 mt-5">
                                    {g.players.map((p: OngoingGamePlayer) => {
                                        return (
                                            <button
                                                className="bg-sky-50/50 py-2 px-4 cursor-pointer"
                                                onClick={() => rejoinGame(g, p)}
                                            >
                                                Re-join game as{" "}
                                                <span className="font-semibold">{p.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
