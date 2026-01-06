import type { Player } from "@context/model/player";
import { classnames } from "@libraries/helpers/dom";
import { useCallback } from "react";
import { useGame, usePlayer } from "@context/hooks";
import { useCurrentTurnScore } from "@hooks/convex/play/useCurrentTurnScore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

type PlayersPanelProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export function PlayersPanel({ isCollapsed, onToggle }: PlayersPanelProps) {
  const game = useGame();
  const player = usePlayer();
  const turnScore = useCurrentTurnScore(game);

  const score = useCallback(
    (p: Player) => {
      if (!p.current || turnScore === undefined) {
        return <span>{p.score}</span>;
      }

      return (
        <>
          {p.score + (turnScore ?? 0)}
          {turnScore > 0 && <span className="text-xs align-super">*</span>}
        </>
      );
    },
    [turnScore],
  );

  return (
    <div className="relative h-full w-full">
      {/* Collapse/Expand Button - Always visible */}
      <button
        onClick={onToggle}
        className="absolute -left-10 top-4 bg-sky-600 hover:bg-sky-700 text-white rounded-l-lg px-3 py-4 shadow-md transition-colors z-50"
        title={isCollapsed ? "Show players" : "Hide players"}
      >
        <FontAwesomeIcon
          icon={isCollapsed ? faChevronLeft : faChevronRight}
          className="text-lg"
        />
      </button>

      {/* Panel Content */}
      {!isCollapsed && (
        <div className="flex flex-col gap-3 p-4 w-full h-full">
          <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-2">
            Players
          </h3>
          <div className="space-y-3">
            {game.players.map((p: Player) => (
              <div
                key={p.id}
                className={classnames(
                  "px-4 py-3 rounded-lg border-2 transition-all",
                  p.current
                    ? "bg-emerald-50 border-emerald-500 shadow-md"
                    : "bg-gray-50 border-gray-300",
                )}
              >
                <div className="flex flex-col gap-1">
                  {player.id === p.id && (
                    <span className="text-xs font-semibold text-sky-600">
                      (You)
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span
                      className={classnames(
                        "font-semibold",
                        p.current && "text-emerald-900",
                      )}
                    >
                      {p.name}
                    </span>
                    <span
                      className={classnames(
                        "text-xl font-bold",
                        p.current ? "text-emerald-900" : "text-gray-700",
                      )}
                    >
                      {score(p)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
