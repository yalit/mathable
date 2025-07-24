import type { Player } from "@context/model/player";
import { useGame } from "@hooks/context/useGame";
import { usePlayer } from "@hooks/context/usePlayer";
import { classnames } from "@libraries/helpers/dom";

export function GameStatusBar() {
  const game = useGame();
  const player = usePlayer();

  const startGame = () => {
    //TODO : implement start game functionality
    console.log("Starting game...");
  };
  return (
    <nav className="w-screen shadow p-5 grid grid-cols-3 items-center">
      <div className="font-xl font-semibold">
        Mathable : {game?.name ?? ""} : {player?.name ?? ""}
      </div>
      <div className="flex justify-center items-center">
        {game?.status === "waiting" && player?.owner && (
          <button
            className="cursor-pointer font-semibold text-lg"
            onClick={startGame}
          >
            Start game
          </button>
        )}
        {game?.status === "ongoing" && (
          <div className="font-semibold">Match ongoing...</div>
        )}
      </div>
      <div className="flex justify-end items-center gap-4">
        {game?.players.map((p: Player) => (
          <div
            key={p._id}
            className={classnames("", player?._id === p._id && "font-semibold")}
          >
            {p.name} - {p.score}
          </div>
        ))}
      </div>
    </nav>
  );
}
