import type { Player } from "@context/model/player";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { useGame } from "@hooks/context/useGame";
import { usePlayer } from "@hooks/context/usePlayer";
import { classnames } from "@libraries/helpers/dom";
import { useSessionMutation } from "convex-helpers/react/sessions";

export function GameStatusBar() {
  const game = useGame();
  const player = usePlayer();
  const startGame = useSessionMutation(api.mutations.public.game.start);

  const handleStartGame = () => {
    if (game && player) {
      startGame({ gameId: game._id as Id<"games"> });
    }
  };
  return (
    <nav className="w-screen shadow p-5 grid grid-cols-3 items-center">
      <div className="font-xl font-semibold">
        Mathable : {game?.name ?? ""} : {player?.name ?? ""}
      </div>
      <div className="flex justify-center items-center gap-3">
        {game?.status === "waiting" && player?.owner && (
          <button
            className="cursor-pointer font-semibold text-lg"
            onClick={handleStartGame}
          >
            Start game
          </button>
        )}
        {game?.status === "ongoing" && (
          <div className="font-semibold">Match ongoing...</div>
        )}
        {player?.current && <div>Your turn !</div>}
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
