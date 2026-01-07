import { Modal } from "@components/includes/modal";
import type { Tile } from "@context/model/tile";
import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCubes } from "@fortawesome/free-solid-svg-icons";
import { GameTile } from "./gameTile";

type BagTilesModalProps = {
  tiles: Tile[];
  closeModal: () => void;
};

export const BagTilesModal = ({ tiles, closeModal }: BagTilesModalProps) => {
  // Group tiles by value
  const tilesByValue = useMemo(() => {
    const grouped = tiles.reduce(
      (acc, tile) => {
        if (!acc[tile.value]) {
          acc[tile.value] = [];
        }
        acc[tile.value].push(tile);
        return acc;
      },
      {} as Record<number, Tile[]>,
    );

    return Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));
  }, [tiles]);

  const remainingTiles = useMemo(() => {
    return tiles.filter((t) => t.location === "in_bag");
  }, [tiles]);

  return (
    <Modal canClose={true} closeModal={closeModal} classname="md:max-w-1/2">
      <div>
        {/* Title */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <FontAwesomeIcon icon={faCubes} className="text-sky-600 text-2xl" />
            <h2 className="text-2xl font-bold text-gray-900">
              All Tiles in Game
            </h2>
          </div>
          <div className="text-gray-600 text-sm">
            {tiles.length} tile{tiles.length !== 1 ? "s" : ""} in game in total
            | {remainingTiles.length} remaining in bag
          </div>
        </div>

        {/* Tiles Grid */}
        {tiles.length > 0 ? (
          <div className="flex flex-wrap items-center gap-6">
            {tilesByValue.map(([value, tilesGroup]) => (
              <div key={value} className="flex flex-col items-center">
                {/* Tile Visual */}
                <GameTile tile={tilesGroup[0]} classname="h-10" />
                {/* Count */}
                <div className="text-gray-700">×{tilesGroup.length}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No tiles remaining in bag
          </div>
        )}
      </div>
    </Modal>
  );
};
