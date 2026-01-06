import { useTranslation } from "@hooks/useTranslation";
import { Modal } from "@components/includes/modal";
import { useGame } from "@context/hooks";
import { useMemo } from "react";
import { classnames } from "@libraries/helpers/dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faMedal } from "@fortawesome/free-solid-svg-icons";

export const EndGameModal = () => {
  const { t } = useTranslation();
  const game = useGame();

  // Sort players by score (desc), then by order (asc) for ties
  const sortedPlayers = useMemo(() => {
    return [...game.players].sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      return a.order - b.order; // Lower order wins ties
    });
  }, [game.players]);

  const winner = useMemo(() => {
    return game.players.find((p) => p.id === game.winner);
  }, [game.players, game.winner]);

  return (
    <Modal canClose={false} closeModal={() => null} classname="min-w-[60vw]">
      <div>
        {/* Title */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-4">
            {t("Game Over")}!
          </div>

          {/* Winner Announcement */}
          {winner && (
            <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-400 rounded-lg">
              <div className="flex items-center justify-center gap-3">
                <FontAwesomeIcon
                  icon={faTrophy}
                  className="text-emerald-500 text-2xl"
                />
                <div>
                  <div className="text-lg font-semibold text-emerald-900">
                    {t("Winner")}: {winner.name}
                  </div>
                  <div className="text-emerald-700">
                    {t("Score")}: {winner.score}
                  </div>
                </div>
                <FontAwesomeIcon
                  icon={faTrophy}
                  className="text-emerald-500 text-2xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="mt-4">
          <div className="text-xl font-semibold text-gray-800 mb-3">
            {t("Final Scores")}
          </div>

          <div className="space-y-2">
            {sortedPlayers.map((player, index) => {
              const isWinner = player.id === game.winner;
              const rank = index + 1;

              return (
                <div
                  key={player.id}
                  className={classnames(
                    "flex items-center gap-4 p-3 rounded-lg border-2 transition-all",
                    isWinner
                      ? "bg-emerald-50 border-emerald-400 shadow-md"
                      : "bg-gray-50 border-gray-200",
                  )}
                >
                  {/* Rank */}
                  <div
                    className={classnames(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                      isWinner
                        ? "bg-emerald-400 text-white"
                        : "bg-gray-300 text-gray-700",
                    )}
                  >
                    {rank === 1 && <FontAwesomeIcon icon={faTrophy} />}
                    {rank === 2 && <FontAwesomeIcon icon={faMedal} />}
                    {rank === 3 && <FontAwesomeIcon icon={faMedal} />}
                    {rank > 3 && rank}
                  </div>

                  {/* Player Name */}
                  <div
                    className={classnames(
                      "flex-1 font-semibold text-lg",
                      isWinner ? "text-emerald-900" : "text-gray-800",
                    )}
                  >
                    {player.name}
                  </div>

                  {/* Score */}
                  <div
                    className={classnames(
                      "text-2xl font-bold",
                      isWinner ? "text-emerald-600" : "text-gray-600",
                    )}
                  >
                    {player.score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
