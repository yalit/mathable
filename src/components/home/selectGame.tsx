import type { Game } from "@context/model/game";
import type { Player } from "@context/model/player";
import { api } from "@cvx/_generated/api";
import { useJoinGame } from "@hooks/useJoinGame";
import { useSessionQuery } from "convex-helpers/react/sessions";

export const SelectGame = () => {
    const sessionGames = useSessionQuery(
        api.queries.game.getNonFinishedForSession,
    );
    const sessionUser = useSessionQuery(api.queries.user.getForSession);
    const { joinGame } = useJoinGame();

    const rejoinGame = (game: Game, player: Player) => {
        joinGame(game, player);
    };
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
                                key={g._id}
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
                                    {g.players.map((p: Player) => {
                                        if (p.userId !== sessionUser?._id) {
                                            return;
                                        }
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
