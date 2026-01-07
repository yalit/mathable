import type { Player } from "@context/model/player";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { classnames } from "@libraries/helpers/dom";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { useCallback, useMemo, useState } from "react";
import type { Game } from "@context/model/game";
import { useGame, usePlayer } from "@context/hooks";
import type { Tile } from "@context/model/tile";
import { Rules } from "@components/global/rules";
import { useCurrentTurnScore } from "@hooks/convex/play/useCurrentTurnScore";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

export function GameStatusBar() {
  const game = useGame();
  const player = usePlayer();
  return (
    <nav className="w-screen shadow-md bg-white border-b-2 border-gray-200 p-5 flex items-center justify-between gap-4">
      <MainTitle />
      <GameActions game={game} player={player} />
    </nav>
  );
}

type StatusBarPartProps = {
  game: Game;
  player: Player;
};

const MainTitle = () => (
  <div className="flex items-center gap-3">
    <Link
      to="/"
      className="text-2xl font-bold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-2"
    >
      <FontAwesomeIcon icon={faHome} className="text-xl" />
      <span>Mathable</span>
    </Link>
  </div>
);

const GameActions = ({ game, player }: StatusBarPartProps) => {
  const endTurn = useSessionMutation(api.controllers.play.mutations.endTurn);
  const [showRules, setShowRules] = useState<boolean>(false);

  const handleEndTurn = () => {
    endTurn({ gameId: game.id as Id<"games"> });
  };

  const remainingTiles = useMemo(
    () => game.tiles.filter((t: Tile) => t.location === "in_bag"),
    [game.tiles],
  );

  const currentPlayerName = useMemo(() => {
    const currentPlayer = game.players.find((p: Player) => p.current);
    return currentPlayer?.name || "";
  }, [game.players]);

  return (
    <div className="flex flex-col justify-center items-center gap-2">
      {/* Game State Info */}
      <div className="text-sm font-semibold text-gray-700">
        {game.status === "ongoing" && !player.current && (
          <span className="text-amber-600">
            Waiting for {currentPlayerName}...
          </span>
        )}
        {player.current && <span className="text-emerald-600">Your turn!</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {player.current && (
          <button
            className="px-3 py-2 border-2 rounded-lg text-sm border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            onClick={handleEndTurn}
          >
            End Turn
          </button>
        )}
        <button
          className="px-3 py-2 border-2 rounded-lg text-sm border-sky-500 bg-sky-50 text-sky-700 font-semibold hover:bg-sky-100 transition-colors cursor-pointer"
          onClick={() => setShowRules(true)}
        >
          Show Rules
        </button>
        <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
          Tiles: {remainingTiles.length}
        </div>
      </div>
      {showRules && <Rules close={() => setShowRules(false)} />}
    </div>
  );
};
