import type { Player } from "@context/model/player";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { classnames } from "@libraries/helpers/dom";
import {
  useSessionMutation,
  useSessionQuery,
} from "convex-helpers/react/sessions";
import { useCallback, useMemo, useState } from "react";
import type { Game } from "@context/model/game";
import { useGame, usePlayer } from "@context/hooks";
import type { Tile } from "@context/model/tile";
import type { Modal } from "@components/includes/modal";
import { Rules } from "@components/global/rules";

export function GameStatusBar() {
  const game = useGame();
  const player = usePlayer();
  return (
    <nav className="w-screen shadow p-5 grid grid-cols-3 items-center">
      <MainTitle game={game} player={player} />
      <GameActions game={game} player={player} />
      <GameInformation game={game} player={player} />
    </nav>
  );
}

type StatusBarPartProps = {
  game: Game;
  player: Player;
};
const MainTitle = ({ player }: StatusBarPartProps) => (
  <div className="font-xl font-semibold">Mathable : {player.name}</div>
);

const GameActions = ({ game, player }: StatusBarPartProps) => {
  const resetTurn = useSessionMutation(api.mutations.public.play.resetTurn);
  const endTurn = useSessionMutation(api.mutations.public.play.endTurn);
  const [showRules, setShowRules] = useState<boolean>(false);

  const handleResetTurn = () => {
    resetTurn({ gameId: game._id as Id<"games"> });
  };

  const handleEndTurn = () => {
    endTurn({ gameId: game._id as Id<"games"> });
  };

  const remainingTiles = useMemo(
    () => game.tiles.filter((t: Tile) => t.location === "in_bag"),
    [game.tiles],
  );

  return (
    <div className="flex justify-center items-center gap-3">
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
          {/*<button
            className="p-2 border rounded border-red-200 cursor-pointer bg-red-100/20"
            onClick={handleResetTurn}
          >
            Reset turn
          </button>
		  */}
        </>
      )}
      <button
        className="p-2 border rounded border-gray-200 cursor-pointer bg-gray-100/20"
        onClick={() => setShowRules(true)}
      >
        Show rules
      </button>
      <div className="">Remaining tiles : {remainingTiles.length}</div>
      {showRules && <Rules close={() => setShowRules(false)} />}
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
