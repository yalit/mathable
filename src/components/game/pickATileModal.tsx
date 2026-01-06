import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal } from "@components/includes/modal";
import { faHandSparkles, faSquare } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@hooks/useTranslation";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { api } from "@cvx/_generated/api";
import { usePlayer } from "@context/hooks";
import type { Id } from "@cvx/_generated/dataModel";

type Props = {
  closeModal: () => void;
};
export const PickATileModal = ({ closeModal }: Props) => {
  const player = usePlayer();
  const { t } = useTranslation();
  const pickATile = useSessionMutation(api.controllers.tile.mutations.pick);
  const handlePick = async () => {
    await pickATile({ playerId: player.id as Id<"players"> });
    closeModal();
  };
  const handleNoPick = () => {
    closeModal();
  };
  return (
    <Modal canClose={false} closeModal={closeModal} classname="max-w-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-200 pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <FontAwesomeIcon
              icon={faHandSparkles}
              className="text-purple-600 text-3xl"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t("Pick a Tile?")}
          </h2>
        </div>

        {/* Info Box - Operator Square */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <FontAwesomeIcon
                icon={faSquare}
                className="text-pink-500 text-2xl"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Operator Square Bonus
              </h3>
              <p className="text-gray-700">
                When using an{" "}
                <span className="font-semibold text-pink-700">Operator</span>{" "}
                cell, you have the opportunity to pick a tile from the remaining
                tiles in the bag.
              </p>
            </div>
          </div>
        </div>

        {/* Warning Box */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Important</h3>
              <p className="text-gray-700">
                Should you choose to{" "}
                <span className="font-semibold text-amber-900">
                  pick a tile
                </span>
                , this pick and the previous moves of your turn will{" "}
                <span className="font-semibold text-amber-900">
                  not be resettable
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleNoPick}
            className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t("Don't pick")}
          </button>
          <button
            type="button"
            onClick={handlePick}
            className="flex-1 py-3 px-4 rounded-lg border-2 border-purple-500 bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors cursor-pointer shadow-md"
          >
            {t("Pick a tile")}
          </button>
        </div>
      </div>
    </Modal>
  );
};
