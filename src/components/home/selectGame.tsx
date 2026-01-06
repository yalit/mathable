import { useJoinGame } from "@hooks/useJoinGame";
import {
  type OngoingGame,
  type OngoingGamePlayer,
  useFetchOngoingGamesForSession,
} from "@hooks/convex/game/useFetchOngoingGamesForSession.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGamepad,
  faUsers,
  faTrophy,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { classnames } from "@libraries/helpers/dom";

export const SelectGame = () => {
  const sessionGames: OngoingGame[] = useFetchOngoingGamesForSession();
  const { joinGame } = useJoinGame();

  const rejoinGame = (game: OngoingGame, player: OngoingGamePlayer) => {
    joinGame(game.token, player.token);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-amber-50 border-amber-400 text-amber-900";
      case "ongoing":
        return "bg-emerald-50 border-emerald-400 text-emerald-900";
      case "finished":
        return "bg-gray-50 border-gray-400 text-gray-900";
      default:
        return "bg-sky-50 border-sky-400 text-sky-900";
    }
  };

  return (
    <>
      {sessionGames && sessionGames.length > 0 && (
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <FontAwesomeIcon
                icon={faGamepad}
                className="text-purple-600 text-2xl"
              />
              <h2 className="text-3xl font-bold text-gray-900">
                Your Ongoing Games
              </h2>
              <FontAwesomeIcon
                icon={faGamepad}
                className="text-purple-600 text-2xl"
              />
            </div>
            <p className="text-gray-600">Continue where you left off!</p>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionGames.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Status Badge */}
                <div
                  className={classnames(
                    "p-3 font-semibold text-center border-b-2",
                    getStatusColor(g.status),
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faGamepad} />
                    <span className="capitalize">{g.status}</span>
                  </div>
                </div>

                {/* Game Info */}
                <div className="p-4 space-y-3">
                  {/* Turn Counter */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-700">Turn:</span>
                    <span className="text-gray-600">{g.currentTurn}</span>
                  </div>

                  {/* Players Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FontAwesomeIcon
                        icon={faUsers}
                        className="text-sky-600 text-sm"
                      />
                      <span className="font-semibold text-gray-700 text-sm">
                        Players ({g.players.length}/4):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {g.players.map((p) => (
                        <div
                          key={p.id}
                          className="px-2 py-1 bg-sky-50 border border-sky-300 rounded text-xs font-medium text-gray-700 flex items-center gap-1"
                        >
                          <span>{p.name}</span>
                          <span className="text-sky-600 font-semibold">
                            ({p.score})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t-2 border-gray-100 p-3 bg-gray-50">
                  <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <FontAwesomeIcon icon={faArrowRight} />
                    Rejoin as:
                  </div>
                  <div className="flex flex-col gap-2">
                    {g.players.map((p: OngoingGamePlayer) => (
                      <button
                        key={p.id}
                        className="w-full py-2 px-3 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 cursor-pointer transition-colors flex items-center justify-center gap-2"
                        onClick={() => rejoinGame(g, p)}
                      >
                        <FontAwesomeIcon icon={faArrowRight} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
