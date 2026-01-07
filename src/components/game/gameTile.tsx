import { NumberIcon } from "@components/includes/icon";
import type { Tile } from "@context/model/tile";
import { classnames } from "@libraries/helpers/dom";
import { useMemo } from "react";

type GameTileProps = {
  tile: Tile;
  classname?: string;
};

export function GameTile({ tile, classname = "" }: GameTileProps) {
  const tileContent = useMemo(() => {
    const split = String(tile.value)
      .split("")
      .map((x) => +x);
    return split.map((n, idx) => (
      <NumberIcon key={tile.id + "_" + idx} icon={n} className="tile" />
    ));
  }, [tile]);

  return (
    <div
      className={classnames(
        "p-2 bg-linear-to-br from-sky-700 to-sky-900 text-white rounded shadow flex justify-center items-center gap-1 aspect-square border border-sky-600 cursor-grab active:cursor-grabbing",
        classname,
      )}
    >
      {tileContent}
    </div>
  );
}
