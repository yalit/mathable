import type { Player } from "@context/model/player";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGame } from "@hooks/context/useGame";
import { usePlayer } from "@hooks/context/usePlayer";
import { classnames } from "@libraries/helpers/dom";
import {
  useSessionMutation,
  useSessionQuery,
} from "convex-helpers/react/sessions";
import { useCallback, useMemo } from "react";

export function GameStatusBar() {
  const game = useGame();
  const player = usePlayer();
  const startGame = useSessionMutation(api.mutations.public.game.start);
  const resetTurn = useSessionMutation(api.mutations.public.game.resetTurn);
  const turnScore = useSessionQuery(api.queries.game.getCurrentTurnScore, {
    gameId: (game?._id as Id<"games">) ?? ("" as Id<"games">),
  });

  const handleStartGame = () => {
    if (game && player) {
      startGame({ gameId: game._id as Id<"games"> });
    }
  };

  const handleResetTurn = () => {
    if (game && player?.current) {
      resetTurn({ gameId: game._id as Id<"games"> });
    }
  };

  const score = useCallback(
    (p: Player) => {
      if (!p.current || turnScore === undefined) {
        return <span>0</span>;
      }

      return (
        <>
          {p.score + (turnScore ?? 0)}
          {turnScore > 0 && <span className="upperscript">*</span>}
        </>
      );
    },
    [player, turnScore],
  );

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
        {player?.current && (
          <button
            className="p-2 border rounded border-gray-200 cursor-pointer"
            onClick={handleResetTurn}
          >
            Reset turn
          </button>
        )}
      </div>
      <div className="flex justify-end items-center gap-4">
        {game?.players.map((p: Player) => (
          <div
            key={p._id}
            className={classnames("", player?._id === p._id && "font-semibold")}
          >
            {p.name} - {score(p)}{" "}
          </div>
        ))}
      </div>
    </nav>
  );
}
