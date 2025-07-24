import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDivide,
  faMinus,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { Cell } from "@context/model/cell";
import { classnames } from "@libraries/helpers/dom";
import { numberIcons, PlayTile } from "./playTile";
import { useDrop } from "react-dnd";
import { DragItemTypes } from "@context/draganddrop/constants";
import type { Tile } from "@context/model/tile";

export function BoardCell({ cell }: { cell: Cell }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => {
    return {
      accept: DragItemTypes.TILE,
      drop: (item: Tile) => console.log(item),
      canDrop: (item: Tile) => {
        return cell.allowedValues.includes(item.value);
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
      return <FontAwesomeIcon icon={numberIcons[cell.value]} />;
    }

    if (cell.type === "multiplier") {
      switch (cell.multiplier) {
        case 2:
          return (
            <>
              <FontAwesomeIcon icon={numberIcons[2]} />
              <FontAwesomeIcon icon={faXmark} className="small" />
            </>
          );
        case 3:
          return (
            <>
              <FontAwesomeIcon icon={numberIcons[3]} />
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
  }, [cell.type]);

  const cellClass = classnames(
    "board__cell relative bg-sky-200 aspect-square p-1 flex justify-center items-center",
    cell.type === "value" && "bg-sky-800! text-white",
    cell.type === "multiplier" && cell.multiplier === 3 && "bg-white!",
    cell.type === "multiplier" && cell.multiplier === 2 && "bg-sky-500!",
    cell.type === "operator" && "bg-pink-300! text-white",
  );

  return (
    <div className={cellClass} ref={drop}>
      <div className="relative flex items-end h-[70%]">{cellContent}</div>
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
    </div>
  );
}
