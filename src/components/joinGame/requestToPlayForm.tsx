import { useGame } from "@context/hooks";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { useMemo, useState, type FormEvent } from "react";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faUserPlus,
  faDoorOpen,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { classnames } from "@libraries/helpers/dom";

export const RequestToPlayForm = () => {
  const game = useGame();
  const [playerName, setPlayerName] = useState<string>("");
  const joinGame = useSessionMutation(api.controllers.game.mutations.join);
  const requestToPlay = async (e: FormEvent) => {
    e.preventDefault();
    const result = await joinGame({
      gameId: game.id as Id<"games">,
      playerName,
    });

    if (result.status !== "success") {
      return;
    }

    if (result.data.playerToken !== "") {
      document.location = `/game/${game.token}/player/${result.data.playerToken}`;
    }
  };

  const canJoin = useMemo(() => {
    return game.players.length < 4;
  }, [game.players]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-4">
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-200 min-w-[90vw] md:min-w-[600px] max-w-2xl">
        {canJoin ? (
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <FontAwesomeIcon
                  icon={faDoorOpen}
                  className="text-sky-600 text-3xl"
                />
                <h2 className="text-3xl font-bold text-gray-900">
                  Join the Game
                </h2>
                <FontAwesomeIcon
                  icon={faDoorOpen}
                  className="text-sky-600 text-3xl"
                />
              </div>
              <p className="text-gray-600 text-lg">
                A game is already in progress!
              </p>
            </div>

            {/* Current Players Info */}
            <div className="mb-6 p-4 bg-sky-50 border-2 border-sky-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faUsers} className="text-sky-600" />
                <h3 className="font-semibold text-gray-800">
                  Current Players ({game.players.length}/4):
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {game.players.map((p) => (
                  <div
                    key={p.id}
                    className="px-3 py-2 bg-white border-2 border-sky-300 rounded-lg shadow-sm text-sm font-medium text-gray-700"
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Join Form */}
            <form onSubmit={requestToPlay} className="space-y-6">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="player_name"
                >
                  Your Name
                </label>
                <input
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-emerald-500 focus:outline-none text-lg transition-colors"
                  id="player_name"
                  name="player_name"
                  placeholder="Enter your name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={classnames(
                  "w-full py-3 px-6 rounded-lg font-semibold text-lg shadow-md transition-all flex items-center justify-center gap-2",
                  playerName === ""
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer transform hover:scale-105",
                )}
                disabled={playerName === ""}
              >
                <FontAwesomeIcon icon={faUserPlus} />
                Join the Game
              </button>
            </form>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mb-4">
              <FontAwesomeIcon
                icon={faXmark}
                className="text-red-500 text-5xl"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Game is Full
            </h2>
            <p className="text-gray-600 text-lg mb-4">
              This game has reached the maximum number of players (4/4).
            </p>
            <p className="text-gray-500">Sorry, better luck next time!</p>
          </div>
        )}
      </div>
    </div>
  );
};
