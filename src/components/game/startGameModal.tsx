import { useTranslation } from "@hooks/useTranslation";
import { Modal } from "@components/includes/modal";
import { useGame, usePlayer } from "@context/hooks";
import { useMemo } from "react";
import { classnames } from "@libraries/helpers/dom";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";

export const StartGameModal = () => {
  const { t } = useTranslation();
  const game = useGame();
  const player = usePlayer();
  const startGame = useSessionMutation(api.mutations.public.game.start);

  const canStart = useMemo(() => game.players.length >= 2, [game.players]);

  const handleStartGame = () => {
    if (game.players.length >= 2) {
      startGame({ gameId: game._id as Id<"games"> });
    }
  };

  return (
    <Modal canClose={false} closeModal={() => null}>
      <div>
        <div className="">
          <div className="font-semibold text-gray-900">
            {t("Game start procedure")}
          </div>
          <div className="mt-2">
            <div className="text-sm text-gray-500">
              {!canStart ? (
                <div>{t("There is not enough players to start the game")}</div>
              ) : (
                <div>{t("The game can be started")}</div>
              )}
            </div>
          </div>
          <div className="mt-2">
            <div className="font-semibold text-gray-600">{t("Players")} :</div>
            <div className="flex items-center gap-2 mt-2">
              {game.players.map((p) => (
                <div
                  key={p._id}
                  className="border border-gray-300 shadow-xs p-2 rounded text-sm"
                >
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-6 ">
        {player.owner ? (
          <button
            type="button"
            className={classnames(
              "inline-flex w-full justify-center rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-xs",
              !canStart && "italic",
              canStart &&
                "cursor-pointer hover:bg-teal-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
            )}
            onClick={handleStartGame}
          >
            Start Game
          </button>
        ) : (
          <div className="italic text-sm">
            {t("Waiting for the owner of the game to start")}
          </div>
        )}
      </div>
    </Modal>
  );
};
