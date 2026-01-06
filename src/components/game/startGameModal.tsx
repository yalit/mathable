import { useTranslation } from "@hooks/useTranslation";
import { Modal } from "@components/includes/modal";
import { useGame, usePlayer } from "@context/hooks";
import { useMemo, useState } from "react";
import { classnames } from "@libraries/helpers/dom";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPlay,
  faClock,
  faShare,
  faCheck,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

export const StartGameModal = () => {
  const { t } = useTranslation();
  const game = useGame();
  const player = usePlayer();
  const startGame = useSessionMutation(api.controllers.game.mutations.start);
  const [copied, setCopied] = useState(false);

  const canStart = useMemo(() => game.players.length >= 2, [game.players]);

  const joinLink = useMemo(() => {
    return `${window.location.origin}/game/${game.token}`;
  }, [game.token]);

  const handleStartGame = () => {
    if (game.players.length >= 2) {
      startGame({ gameId: game.id as Id<"games"> });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <Modal canClose={false} closeModal={() => null} classname="min-w-150">
      <div>
        {/* Title */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <FontAwesomeIcon
              icon={faUsers}
              className="text-teal-600 text-2xl"
            />
            <h2 className="text-3xl font-bold text-gray-900">
              {t("Game start procedure")}
            </h2>
            <FontAwesomeIcon
              icon={faUsers}
              className="text-teal-600 text-2xl"
            />
          </div>
        </div>

        {/* Status Message */}
        <div
          className={classnames(
            "mb-6 p-4 border-2 rounded-lg",
            canStart
              ? "bg-emerald-50 border-emerald-400"
              : "bg-amber-50 border-amber-400",
          )}
        >
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={canStart ? faCheck : faExclamationTriangle}
              className={classnames(
                "text-2xl",
                canStart ? "text-emerald-600" : "text-amber-600",
              )}
            />
            <div>
              <div
                className={classnames(
                  "font-semibold text-lg",
                  canStart ? "text-emerald-900" : "text-amber-900",
                )}
              >
                {!canStart
                  ? t("There is not enough players to start the game")
                  : t("The game can be started")}
              </div>
              {!canStart && (
                <div className="text-amber-700 text-sm mt-1">
                  {t("Minimum 2 players required")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Share Link Section - Only shown to owner when game is not full */}
        {player.owner && game.players.length < 4 && (
          <div className="mb-6 p-4 bg-sky-50 border-2 border-sky-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faShare} className="text-sky-600" />
              <h3 className="font-semibold text-gray-800">
                {t("Invite Friends")}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {t("Share this link with your friends so they can join the game")}
              :
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinLink}
                readOnly
                className="flex-1 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-mono text-gray-700"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={classnames(
                  "px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2",
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-sky-600 text-white hover:bg-sky-700",
                )}
              >
                <FontAwesomeIcon icon={copied ? faCheck : faShare} />
                {copied ? t("Copied!") : t("Copy")}
              </button>
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faUsers} className="text-gray-600" />
            <h3 className="font-semibold text-gray-800">
              {t("Players")} ({game.players.length}/4):
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {game.players.map((p) => (
              <div
                key={p.id}
                className={classnames(
                  "px-4 py-2 rounded-lg border-2 shadow-sm font-medium",
                  p.id === player.id
                    ? "bg-teal-50 border-teal-400 text-teal-900"
                    : "bg-gray-50 border-gray-300 text-gray-700",
                )}
              >
                {p.name} {p.id === player.id && "(You)"}
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          {player.owner ? (
            <button
              type="button"
              className={classnames(
                "w-full py-3 px-6 rounded-lg font-semibold text-lg shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                !canStart && "bg-gray-300 text-gray-500 cursor-not-allowed",
                canStart &&
                  "bg-teal-600 text-white hover:bg-teal-700 cursor-pointer transform hover:scale-105",
              )}
              onClick={handleStartGame}
              disabled={!canStart}
            >
              <span>
                <FontAwesomeIcon icon={faPlay} />
              </span>
              <span>{t("Start Game")}</span>
            </button>
          ) : (
            <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
              <FontAwesomeIcon
                icon={faClock}
                className="text-gray-400 text-2xl mb-2"
              />
              <div className="text-gray-600 font-medium">
                {t("Waiting for the owner of the game to start")}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
