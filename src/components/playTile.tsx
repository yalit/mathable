import type { Tile } from "@context/model/tile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  fa0,
  fa1,
  fa2,
  fa3,
  fa4,
  fa5,
  fa6,
  fa7,
  fa8,
  fa9,
} from "@fortawesome/free-solid-svg-icons";
import { usePlayer } from "@hooks/context/usePlayer";
import { useMemo } from "react";
import { useDrag } from "react-dnd";
import { DragItemTypes } from "@context/draganddrop/constants";
import { classnames } from "@libraries/helpers/dom";

export const numberIcons: IconProp[] = [
  fa0,
  fa1,
  fa2,
  fa3,
  fa4,
  fa5,
  fa6,
  fa7,
  fa8,
  fa9,
];

type TileProps = { tile: Tile; tileClass?: string };

export function PlayTile({ tile, tileClass = "" }: TileProps) {
  const player = usePlayer();

  const tileContent = useMemo(() => {
    const split = String(tile.value)
      .split("")
      .map((x) => +x);
    return split.map((n, idx) => (
      <FontAwesomeIcon
        key={tile._id + "_" + idx}
        icon={numberIcons[n]}
        className="tile"
      />
    ));
  }, [tile]);

  const [_, drag] = useDrag(
    () => ({
      type: DragItemTypes.TILE,
      item: tile,
      canDrag: () => player?.current ?? false,
    }),
    [player],
  );

  return (
    <div
      className={classnames(
        "bg-sky-800 text-white rounded-sm flex justify-center items-center gap-1 aspect-square",
        tileClass,
      )}
      ref={drag}
    >
      {tileContent}
    </div>
  );
}
