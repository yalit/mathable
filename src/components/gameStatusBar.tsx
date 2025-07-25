import type { Player } from "@context/model/player";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { useGame } from "@hooks/context/useGame";
import { usePlayer } from "@hooks/context/usePlayer";
import { classnames } from "@libraries/helpers/dom";
import {
  useSessionMutation,
  useSessionQuery,
} from "convex-helpers/react/sessions";
import { useCallback } from "react";
import type { Game } from "@context/model/game";

export function GameStatusBar() {
  const game = useGame();
  const player = usePlayer();
  return (
    <nav className="w-screen shadow p-5 grid grid-cols-3 items-center">
      {game && player && (
        <>
          <MainTitle game={game} player={player} />
          <GameActions game={game} player={player} />
          <GameInformation game={game} player={player} />
        </>
      )}
    </nav>
  );
}

type StatusBarPartProps = {
  game: Game;
  player: Player;
};
const MainTitle = ({ game, player }: StatusBarPartProps) => (
  <div className="font-xl font-semibold">
    Mathable : {game?.name ?? ""} : {player?.name ?? ""}
  </div>
);

const GameActions = ({ game, player }: StatusBarPartProps) => {
  const startGame = useSessionMutation(api.mutations.public.game.start);
  const resetTurn = useSessionMutation(api.mutations.public.play.resetTurn);
  const endTurn = useSessionMutation(api.mutations.public.play.endTurn);

  const handleStartGame = () => {
    startGame({ gameId: game._id as Id<"games"> });
  };

  const handleResetTurn = () => {
    resetTurn({ gameId: game._id as Id<"games"> });
  };

  const handleEndTurn = () => {
    endTurn({ gameId: game._id as Id<"games"> });
  };
  return (
    <div className="flex justify-center items-center gap-3">
      {game.status === "waiting" && player.owner && (
        <button
          className="cursor-pointer font-semibold text-lg"
          onClick={handleStartGame}
        >
          Start game
        </button>
      )}
      {game.status === "ongoing" && !player.current && (
        <div className="font-semibold">Match ongoing...</div>
      )}
      {player.current && <div>Your turn !</div>}
      {player.current && (
        <>
          <button
            className="p-2 border rounded border-green-500 cursor-pointer bg-green-100/20"
            onClick={handleEndTurn}
          >
            End turn
          </button>
          <button
            className="p-2 border rounded border-red-200 cursor-pointer bg-red-100/20"
            onClick={handleResetTurn}
          >
            Reset turn
          </button>
        </>
      )}
    </div>
  );
};

const GameInformation = ({ game, player }: StatusBarPartProps) => {
  const turnScore = useSessionQuery(api.queries.play.getCurrentTurnScore, {
    gameId: (game?._id as Id<"games">) ?? ("" as Id<"games">),
  });

  const score = useCallback(
    (p: Player) => {
      if (!p.current || turnScore === undefined) {
        return <span>{p.score}</span>;
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
    <div className="flex justify-end items-center gap-4">
      {game.players.map((p: Player) => (
        <div
          key={p._id}
          className={classnames("", player._id === p._id && "font-semibold")}
        >
          {p.name} - {score(p)}{" "}
        </div>
      ))}
    </div>
  );
};
