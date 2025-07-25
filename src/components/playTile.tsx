import type { Tile } from "@context/model/tile";
import { usePlayer } from "@hooks/context/usePlayer";
import { useMemo } from "react";
import { useDrag } from "react-dnd";
import { DragItemTypes } from "@context/draganddrop/constants";
import { classnames } from "@libraries/helpers/dom";
import { NumberIcon } from "./icon";

type TileProps = { tile: Tile; tileClass?: string };

export function PlayTile({ tile, tileClass = "" }: TileProps) {
  const player = usePlayer();

  const tileContent = useMemo(() => {
    const split = String(tile.value)
      .split("")
      .map((x) => +x);
    return split.map((n, idx) => (
      <NumberIcon key={tile._id + "_" + idx} icon={n} className="tile" />
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
        "bg-sky-800 text-white rounded-sm flex justify-center items-center gap-1 aspect-square h-14 max-h-[90%]",
        tileClass,
      )}
      ref={drag}
    >
      {tileContent}
    </div>
  );
}
