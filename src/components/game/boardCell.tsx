import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDivide,
  faMinus,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { Cell } from "@context/model/cell";
import { classnames } from "@libraries/helpers/dom";
import { PlayTile } from "@components/game/playTile";
import { useDrop } from "react-dnd";
import { DragItemTypes } from "@context/draganddrop/constants";
import type { Tile } from "@context/model/tile";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { usePlayer } from "@context/hooks";
import { PickATileModal } from "./pickATileModal";
import { NumberIcon } from "@components/includes/icon";

export function BoardCell({ cell }: { cell: Cell }) {
  const player = usePlayer();
  const playTileToCell = useSessionMutation(
    api.controllers.tile.mutations.playToCell,
  );
  const [displayPickModal, setDisplayPickModal] = useState<boolean>(false);

  const handleDropTile = (item: Tile) => {
    playTileToCell({
      tileId: item.id as Id<"tiles">,
      cellId: cell.id as Id<"cells">,
      playerId: player.id as Id<"players">,
    });
    //TODO : check if the game has still available tile
    if (cell.type === "operator") {
      setDisplayPickModal(true);
    }
  };

  const [{ isOver, canDrop }, drop] = useDrop(() => {
    return {
      accept: DragItemTypes.TILE,
      drop: handleDropTile,
      canDrop: (item: Tile) => {
        if (cell.tile) {
          return false;
        }
        return player.current && cell.allowedValues.includes(item.value);
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    };
  }, [cell, cell.allowedValues]);

  const cellContent = useMemo(() => {
    if (cell.type === "empty") {
      return null;
    }

    if (cell.type === "value") {
      // return <FontAwesomeIcon icon={numberIcons[cell.value]} />;
      return <NumberIcon icon={cell.value} />;
    }

    if (cell.type === "multiplier") {
      switch (cell.multiplier) {
        case 2:
          return (
            <>
              <NumberIcon icon={2} />
              <FontAwesomeIcon icon={faXmark} className="small" />
            </>
          );
        case 3:
          return (
            <>
              <NumberIcon icon={3} />
              <FontAwesomeIcon icon={faXmark} className="small" />
            </>
          );
      }
    }

    if (cell.type === "operator") {
      switch (cell.operator) {
        case "+":
          return <FontAwesomeIcon icon={faPlus} />;
        case "-":
          return <FontAwesomeIcon icon={faMinus} />;
        case "*":
          return <FontAwesomeIcon icon={faXmark} />;
        case "/":
          return <FontAwesomeIcon icon={faDivide} />;
      }
    }
  }, [cell]);

  const cellClass = classnames(
    "board__cell relative bg-sky-200 aspect-square p-1 flex justify-center items-center",
    cell.type === "value" && "bg-sky-800! text-white",
    cell.type === "multiplier" && cell.multiplier === 3 && "bg-white!",
    cell.type === "multiplier" && cell.multiplier === 2 && "bg-sky-500!",
    cell.type === "operator" && "bg-pink-300! text-white",
  );

  return (
    <div
      className={cellClass}
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
    >
      <div className="relative flex items-end gap-1">{cellContent}</div>
      {cell.tile && (
        <PlayTile tile={cell.tile} tileClass="absolute inset-0.5" />
      )}
      {isOver && (
        <div
          className={classnames(
            "absolute inset-0 bg-red-300/50",
            canDrop && "bg-green-300/50!",
          )}
        ></div>
      )}
      {displayPickModal && (
        <PickATileModal closeModal={() => setDisplayPickModal(false)} />
      )}
    </div>
  );
}
