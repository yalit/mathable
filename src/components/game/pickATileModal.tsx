import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal } from "@components/includes/modal";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
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
    <Modal canClose={false} closeModal={closeModal}>
      <div>
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100">
          <FontAwesomeIcon
            icon={faCircleQuestion}
            aria-hidden="true"
            className="size-6 text-blue-600"
          />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <div className="text-base font-semibold text-gray-900">
            {t("Pick a Tile ?")}
          </div>
          <div className="mt-2">
            <p className="text-gray-500">
              When using an <span className="font-semibold">Operator</span>{" "}
              cell, you have the opportunity to pick a tile from the remaining
              tiles in the bag.
            </p>
            <p className="text-gray-500">
              Should you choose to{" "}
              <span className="font-semibold">pick a tile</span>, this pick and
              the previous moves of your turn would{" "}
              <span className="font-semibold">not be resettable</span>
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-6 flex justify-center items-center gap-3">
        <button
          type="button"
          onClick={handleNoPick}
          className="inline-flex cursor-pointer w-full justify-center rounded-md bg-amber-600/70 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
        >
          {t("Don't pick")}
        </button>
        <button
          type="button"
          onClick={handlePick}
          className="inline-flex cursor-pointer w-full justify-center rounded-md bg-blue-600/70 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {t("Pick a tile")}
        </button>
      </div>
    </Modal>
  );
};
