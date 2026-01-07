import type { Tile } from "@context/model/tile";
import { useMemo, useEffect } from "react";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { DragItemTypes } from "@context/draganddrop/constants";
import { classnames } from "@libraries/helpers/dom";
import { usePlayer } from "@context/hooks";
import { GameTile } from "./gameTile";

type TileProps = { tile: Tile; tileClass?: string };

export function PlayTile({ tile, tileClass = "" }: TileProps) {
  const player = usePlayer();

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

  const tileClassName = useMemo<string>(() => {
    return classnames(
      player.current &&
        tile.location === "in_hand" &&
        "hover:shadow-lg hover:border-sky-400",
      isDragging && "opacity-0",
      tileClass,
    );
  }, [player, isDragging]);

  return (
    <div ref={drag as unknown as React.RefObject<HTMLDivElement>}>
      <GameTile tile={tile} classname={tileClassName} />
    </div>
  );
}
