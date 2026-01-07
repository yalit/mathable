import type { Tile } from "@context/model/tile";
import { useMemo, useEffect } from "react";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { DragItemTypes } from "@context/draganddrop/constants";
import { classnames } from "@libraries/helpers/dom";
import { usePlayer } from "@context/hooks";
import { NumberIcon } from "@components/includes/icon";

type TileProps = { tile: Tile; tileClass?: string };

export function PlayTile({ tile, tileClass = "" }: TileProps) {
  const player = usePlayer();

  const tileContent = useMemo(() => {
    const split = String(tile.value)
      .split("")
      .map((x) => +x);
    return split.map((n, idx) => (
      <NumberIcon key={tile.id + "_" + idx} icon={n} className="tile" />
    ));
  }, [tile]);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: DragItemTypes.TILE,
      item: tile,
      canDrag: () => player.current && tile.location === "in_hand",
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [player, tile],
  );

  // Hide the native browser drag preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div
      className={classnames(
        "bg-linear-to-br from-sky-700 to-sky-900 text-white rounded shadow flex justify-center items-center gap-1 aspect-square border border-sky-600 cursor-grab active:cursor-grabbing",
        player.current &&
          tile.location === "in_hand" &&
          "hover:shadow-lg hover:border-sky-400",
        isDragging && "opacity-0",
        tileClass,
      )}
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
    >
      {tileContent}
    </div>
  );
}
