import { useState, type FormEvent } from "react";
import { useCreateGame } from "@hooks/convex/game/useCreateGame.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faGamepad } from "@fortawesome/free-solid-svg-icons";
import { classnames } from "@libraries/helpers/dom";

export const CreateGameCard = () => {
  const [playerName, setPlayerName] = useState("");
  const createGame = useCreateGame();

  const handleClickOnCreate = async (e: FormEvent) => {
    e.preventDefault();

    if (playerName === "") {
      return;
    }

    const { status, data } = await createGame(playerName);
    const { gameToken, playerToken } = data;
    if (
      status === "success" &&
      gameToken &&
      gameToken !== "" &&
      playerToken &&
      playerToken !== ""
    ) {
      document.location = `/game/${gameToken}/player/${playerToken}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6 max-w-md w-full">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <FontAwesomeIcon icon={faGamepad} className="text-sky-600 text-2xl" />
          <h2 className="text-3xl font-bold text-gray-900">
            Create a New Game
          </h2>
          <FontAwesomeIcon icon={faGamepad} className="text-sky-600 text-2xl" />
        </div>
        <p className="text-gray-600">Start your mathematical adventure!</p>
      </div>

      {/* Form */}
      <form onSubmit={handleClickOnCreate} className="space-y-6">
        <div className="bg-sky-50 border-2 border-sky-200 rounded-lg p-4">
          <label
            className="block text-sm font-semibold text-gray-700 mb-2"
            htmlFor="player_name"
          >
            Your Name
          </label>
          <input
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-sky-500 focus:outline-none text-lg transition-colors"
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
              : "bg-sky-600 text-white hover:bg-sky-700 cursor-pointer transform hover:scale-105",
          )}
          disabled={playerName === ""}
        >
          <FontAwesomeIcon icon={faPlus} />
          Create Game
        </button>
      </form>
    </div>
  );
};
